import { pluginKey } from '../system/plugin.types';
import type {
  AccessBrokerEvents,
  AccessBrokerPorts,
  ActiveLease,
  IAccessBroker,
  LendableAccess,
} from '../system/plugins/access-broker/access-broker.types';
import { covers, type Instant, instant, leaseId, type PersonId, type ResourceId } from '../use-cases/branded';
import type { LeaseDenied, LeaseExpired, LeaseGranted, LeaseRequest, LeaseReturned } from '../use-cases/flows.types';
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
  readonly inUse: number;
  readonly headroom: number;
}

class MemoryAccessBroker extends MemoryPlugin<AccessBrokerEvents> implements IAccessBroker {
  readonly key = pluginKey('access-broker');
  readonly name = 'Access broker';
  readonly description = 'Lends LLM accounts to runs, with the secret only in the run environment';

  private sequence = 0;
  private readonly active = new Map<string, ActiveLease>();

  constructor(private readonly ports: AccessBrokerPorts) {
    super(ports.clock);
  }

  /** Tira os emprestimos vencidos; ligado, cada um vira evento. */
  private sweep(): void {
    const now = this.clock.now();
    for (const lease of [...this.active.values()]) {
      if (now <= lease.expiresAt) continue;
      this.active.delete(lease.id);
      this.emit('access-broker:lease-expired', { lease: lease.id, access: lease.access });
    }
  }

  private inUse(access: ResourceId): number {
    return [...this.active.values()].filter((l) => l.access === access).length;
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

  async requestLease(person: PersonId, request: LeaseRequest): Promise<LeaseGranted | LeaseDenied> {
    this.sweep();
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

    const candidates: Candidate[] = [];
    for (const { access, secret } of cleared) {
      const inUse = this.inUse(access.id);
      if (access.concurrencyLimit !== undefined && inUse >= access.concurrencyLimit) continue;
      candidates.push({ access, secret, inUse, headroom: headroom(await this.ports.usage.usage(access.id)) });
    }
    if (candidates.length === 0) {
      return this.deny(person, request, {
        code: 'all-at-provider-limit',
        detail: `todos os acessos ${request.kind} estao no limite que o provedor declara`,
      });
    }

    const [chosen] = [...candidates].sort((a, b) => a.inUse - b.inUse || b.headroom - a.headroom);
    if (chosen === undefined) throw new Error('nenhum candidato');

    this.sequence += 1;
    const grantedAt = this.clock.now();
    const lease: ActiveLease = {
      state: 'granted',
      id: leaseId(`lease-${this.sequence}`),
      access: chosen.access.id,
      grantedAt,
      expiresAt: instant(grantedAt + this.ports.settings.leaseTtlMs),
      shared: chosen.inUse > 0,
      person,
      repository: request.repository,
      task: request.task,
    };
    this.active.set(lease.id, lease);
    const { state: _, ...fact } = lease;
    this.emit('access-broker:lease-granted', fact);

    return {
      state: 'granted',
      id: lease.id,
      access: lease.access,
      env: { [chosen.access.envVar]: chosen.secret },
      grantedAt: lease.grantedAt,
      expiresAt: lease.expiresAt,
      shared: lease.shared,
    };
  }

  async returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired> {
    this.sweep();
    if (!this.active.delete(lease.id)) return { state: 'expired', id: lease.id };
    this.emit('access-broker:lease-returned', { lease: lease.id, access: lease.access });
    return { state: 'returned', id: lease.id };
  }

  async leases(): Promise<readonly ActiveLease[]> {
    this.sweep();
    return [...this.active.values()];
  }
}

/**
 * O emprestimo em memoria. A conta escolhida e a livre com mais folga na
 * janela; sem conta livre, a menos ocupada, dividida.
 */
export function createMemoryAccessBroker(ports: AccessBrokerPorts): IAccessBroker {
  return new MemoryAccessBroker(ports);
}
