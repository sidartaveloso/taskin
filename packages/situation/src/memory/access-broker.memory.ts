import { pluginKey } from '../system/plugin.types';
import type {
  AccessBrokerEvents,
  AccessBrokerPorts,
  ActiveLease,
  IAccessBroker,
  LendableAccess,
} from '../system/plugins/access-broker/access-broker.types';
import { covers, type Instant, instant, leaseId, type PersonId, type ResourceId } from '../use-cases/branded';
import type {
  AccessGrant,
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseRequest,
  LeaseReturned,
} from '../use-cases/flows.types';
import type { UsageReading } from '../use-cases/ports.types';
import { MemoryPlugin } from './plugin.memory';

/**
 * Quando a cota de uma conta acaba, se cada execucao nela gasta `tokensPerMs`:
 * o fim da janela, ou antes, se o que resta acabar primeiro. Dividir a conta
 * multiplica o gasto, e a janela acaba antes.
 */
export function projectWindowEnd(reading: UsageReading, now: Instant, runs: number, tokensPerMs: number): Instant {
  const remaining = Math.max(0, reading.limit - reading.used);
  const burn = runs * tokensPerMs;
  if (burn <= 0) return reading.windowEndsAt;
  return instant(Math.min(reading.windowEndsAt, now + Math.floor(remaining / burn)));
}

/** A folga de uma conta na janela, de 0 a 1. Sem leitura do provedor, conta como toda livre. */
function headroom(reading: UsageReading | undefined): number {
  if (reading === undefined || reading.limit <= 0) return 1;
  return Math.max(0, reading.limit - reading.used) / reading.limit;
}

interface Candidate {
  readonly access: LendableAccess;
  readonly secret: string;
  /** As reservas em curso nesta conta. Zero para a conta sem capacidade declarada. */
  readonly held: number;
  /** Quanto a conta esta ocupada: as execucoes em aberto no registro de execucoes. */
  readonly busy: number;
  readonly headroom: number;
}

/** O que a reserva guarda: o contador dos ids e as reservas em curso, nunca o segredo. */
export interface LeaseState {
  sequence: number;
  active: ActiveLease[];
}

/**
 * Onde o estado das reservas mora. Cada operacao le, decide e grava dentro de
 * uma transacao: na memoria e so a variavel; no disco, o arquivo com trava.
 * So as contas com capacidade declarada passam a ter o que guardar aqui.
 */
export interface ILeaseStore {
  transaction<T>(work: (state: LeaseState) => Promise<T>): Promise<T>;
}

export function createMemoryLeaseStore(): ILeaseStore {
  const state: LeaseState = { sequence: 0, active: [] };
  return { transaction: (work) => work(state) };
}

class MemoryAccessBroker extends MemoryPlugin<AccessBrokerEvents> implements IAccessBroker {
  readonly key = pluginKey('access-broker');
  readonly name = 'Access broker';
  readonly description =
    'Picks LLM accounts for runs, with the secret only in the run environment; reserves a slot only where the account declares capacity';

  constructor(
    private readonly ports: AccessBrokerPorts,
    private readonly store: ILeaseStore,
  ) {
    super(ports.clock);
  }

  /** Tira as reservas vencidas; ligado, cada uma vira evento. */
  private sweep(state: LeaseState): void {
    const now = this.clock.now();
    const expired = state.active.filter((l) => now > l.expiresAt);
    state.active = state.active.filter((l) => now <= l.expiresAt);
    for (const lease of expired) {
      this.emit('access-broker:lease-expired', { lease: lease.id, access: lease.access });
    }
  }

  private held(state: LeaseState, access: ResourceId): number {
    return state.active.filter((l) => l.access === access).length;
  }

  private deny(person: PersonId, request: LeaseRequest, reason: LeaseDenied['reason']): LeaseDenied {
    this.emit('access-broker:lease-denied', {
      person,
      repository: request.repository,
      task: request.task,
      kind: request.kind,
      reason,
    });
    return { state: 'denied', reason };
  }

  requestLease(person: PersonId, request: LeaseRequest): Promise<AccessGrant | LeaseDenied> {
    return this.store.transaction((state) => this.pick(state, person, request));
  }

  private async pick(state: LeaseState, person: PersonId, request: LeaseRequest): Promise<AccessGrant | LeaseDenied> {
    this.sweep(state);
    const listed = await this.ports.catalog.accesses(person, request.repository, request.kind);

    const held: { access: LendableAccess; secret: string }[] = [];
    for (const access of listed) {
      const secret = await this.ports.secrets.read(person, access.secret);
      if (secret !== undefined) held.push({ access, secret });
    }
    if (held.length === 0) {
      return this.deny(person, request, {
        code: 'no-access-of-kind',
        detail: `nenhum acesso ${request.kind} a vista de ${person} em ${request.repository}`,
      });
    }

    const cleared = held.filter((h) => covers(h.access.clearance, request.sensitivity));
    if (cleared.length === 0) {
      return this.deny(person, request, {
        code: 'no-cleared-access',
        detail: `nenhum acesso ${request.kind} liberado para dado ${request.sensitivity}`,
      });
    }

    const openRuns = await this.ports.runs.openRuns();
    const candidates: Candidate[] = [];
    for (const { access, secret } of cleared) {
      const reserved = this.held(state, access.id);
      if (access.concurrencyLimit !== undefined && reserved >= access.concurrencyLimit) continue;
      const open = openRuns.filter((r) => r.access === access.id).length;
      candidates.push({
        access,
        secret,
        held: reserved,
        // Uma reserva ainda sem execucao comecada tambem ocupa a conta; depois que a execucao comeca, e a mesma vaga.
        busy: access.concurrencyLimit === undefined ? open : Math.max(open, reserved),
        headroom: headroom(await this.ports.usage.usage(access.id)),
      });
    }
    if (candidates.length === 0) {
      return this.deny(person, request, {
        code: 'all-at-provider-limit',
        detail: `todos os acessos ${request.kind} declaram capacidade e estao com todas as vagas reservadas`,
      });
    }

    const [chosen] = [...candidates].sort((a, b) => a.busy - b.busy || b.headroom - a.headroom);
    if (chosen === undefined) throw new Error('nenhum candidato');

    const env = { [chosen.access.envVar]: chosen.secret };
    // Sem capacidade declarada nao ha vaga a ocupar: o segredo vai, e nada e gravado.
    if (chosen.access.concurrencyLimit === undefined) {
      return { state: 'granted', reserved: false, access: chosen.access.id, env };
    }

    state.sequence += 1;
    const grantedAt = this.clock.now();
    const lease: ActiveLease = {
      state: 'granted',
      reserved: true,
      id: leaseId(`lease-${state.sequence}`),
      access: chosen.access.id,
      grantedAt,
      expiresAt: instant(grantedAt + this.ports.settings.leaseTtlMs),
      shared: chosen.held > 0,
      person,
      repository: request.repository,
      task: request.task,
    };
    state.active.push(lease);
    const { state: _, ...fact } = lease;
    this.emit('access-broker:lease-granted', fact);

    return {
      state: 'granted',
      reserved: true,
      id: lease.id,
      access: lease.access,
      env,
      grantedAt: lease.grantedAt,
      expiresAt: lease.expiresAt,
      shared: lease.shared,
    };
  }

  returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired> {
    return this.store.transaction(async (state) => {
      this.sweep(state);
      const before = state.active.length;
      state.active = state.active.filter((l) => l.id !== lease.id);
      if (state.active.length === before) return { state: 'expired', id: lease.id };
      this.emit('access-broker:lease-returned', { lease: lease.id, access: lease.access });
      return { state: 'returned', id: lease.id };
    });
  }

  leases(): Promise<readonly ActiveLease[]> {
    return this.store.transaction(async (state) => {
      this.sweep(state);
      return [...state.active];
    });
  }
}

/**
 * O access broker em memoria. Entre as contas liberadas, escolhe a menos
 * ocupada (as execucoes em aberto no registro), e a de mais folga na janela
 * quando empatam. So a conta com capacidade declarada gera reserva.
 */
export function createMemoryAccessBroker(
  ports: AccessBrokerPorts,
  store: ILeaseStore = createMemoryLeaseStore(),
): IAccessBroker {
  return new MemoryAccessBroker(ports, store);
}
