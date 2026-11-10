import { expect } from 'vitest';
import { type DataClass, instant, resourceId, secretRef, tokenCount } from '../../../use-cases/branded';
import type { AccessGrant, AccessGranted, LeaseDenied, LeaseGranted } from '../../../use-cases/flows.types';
import { ANA, BRUNO, CLAUDE_CODE, leaseRequest, REPO, secretValueOf } from '../../../use-cases/scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { FakePluginPorts } from '../../system.fake-ports';
import type { AccessBrokerEvents, IAccessBroker, LendableAccess } from './access-broker.types';

const HOUR = 60 * 60 * 1000;
const ENV_VAR = 'CLAUDE_CODE_OAUTH_TOKEN';

function lendable(name: string, options: Partial<LendableAccess> = {}): LendableAccess {
  return {
    id: resourceId(name),
    name,
    accessKind: CLAUDE_CODE,
    secret: secretRef(`op://cofre/${name}/token`),
    envVar: ENV_VAR,
    clearance: 'public',
    ...options,
  };
}

/** Uma conta a vista da Ana, com o segredo na guarda dela. */
function anaHas(ports: FakePluginPorts, name: string, options: Partial<LendableAccess> = {}): LendableAccess {
  const access = lendable(name, options);
  ports.catalog.add(ANA, REPO, access);
  ports.secrets.set(ANA, access.secret, secretValueOf(name));
  return access;
}

function granted(result: AccessGrant | LeaseDenied): AccessGrant {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('granted');
  return result as AccessGrant;
}

/** O acesso entregue com uma reserva: a conta declara capacidade. */
function reserved(result: AccessGrant | LeaseDenied): LeaseGranted {
  const grant = granted(result);
  expect(grant.reserved).toBe(true);
  return grant as LeaseGranted;
}

/** O acesso entregue sem reserva: a conta nao declara capacidade. */
function unreserved(result: AccessGrant | LeaseDenied): AccessGranted {
  const grant = granted(result);
  expect(grant.reserved).toBe(false);
  return grant as AccessGranted;
}

function denied(result: AccessGrant | LeaseDenied): LeaseDenied {
  expect(result.state).toBe('denied');
  return result as LeaseDenied;
}

const request = (sensitivity: DataClass = 'public', task = 'task-1') => leaseRequest(sensitivity, task);

/** Comecam `count` execucoes na conta, no registro de execucoes, e nenhuma termina. */
function runsOpenOn(ports: FakePluginPorts, access: LendableAccess, count: number): void {
  ports.runs.begin(access.id, ports.clock.now(), count);
}

export const ACCESS_BROKER_CONTRACT_CASES: readonly PluginContractCase<IAccessBroker>[] = [
  ...lifecycleCases<AccessBrokerEvents, IAccessBroker>(async (broker, ports) => {
    anaHas(ports, 'conta-a', { concurrencyLimit: 2 });
    await broker.requestLease(ANA, request());
    return 'access-broker:lease-granted';
  }, 'access-broker:lease-granted'),

  // ─── Sem capacidade declarada: o acesso so e entregue ────────────────────
  {
    name: 'conta sem capacidade declarada: entrega o segredo so no ambiente da execucao, sem reserva, sem prazo e sem shared',
    async run(broker, ports) {
      const conta = anaHas(ports, 'conta-a');

      const grant = unreserved(await broker.requestLease(ANA, request()));

      expect(grant.access).toBe(conta.id);
      expect(grant.env).toEqual({ [ENV_VAR]: secretValueOf('conta-a') });
      for (const field of ['id', 'grantedAt', 'expiresAt', 'shared']) expect(grant).not.toHaveProperty(field);
      expect(await broker.leases()).toEqual([]);
    },
  },
  {
    name: 'conta sem capacidade declarada atende varias rodadas sem gravar reserva, e o tempo nao a tira de nenhuma',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, [
        'access-broker:lease-granted',
        'access-broker:lease-returned',
        'access-broker:lease-expired',
      ]);
      const conta = anaHas(ports, 'conta-a');

      for (let round = 1; round <= 5; round += 1) {
        expect(unreserved(await broker.requestLease(ANA, request('public', `task-${round}`))).access).toBe(conta.id);
      }
      ports.clock.advance(10 * ports.settings.leaseTtlMs);
      expect(unreserved(await broker.requestLease(ANA, request('public', 'task-6'))).access).toBe(conta.id);

      expect(await broker.leases()).toEqual([]);
      expect(seen).toEqual([]);
    },
  },
  {
    name: 'entre duas contas sem capacidade declarada, a rodada nova vai a que tem menos execucoes em aberto no registro',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      const b = anaHas(ports, 'conta-b');
      runsOpenOn(ports, a, 2);
      runsOpenOn(ports, b, 1);

      expect(unreserved(await broker.requestLease(ANA, request('public', 'task-1'))).access).toBe(b.id);

      runsOpenOn(ports, b, 2);
      expect(unreserved(await broker.requestLease(ANA, request('public', 'task-2'))).access).toBe(a.id);
    },
  },
  {
    name: 'a ocupacao vem das execucoes em aberto, nao dos pedidos: pedir sem comecar a execucao nao ocupa a conta',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      anaHas(ports, 'conta-b');

      const first = unreserved(await broker.requestLease(ANA, request('public', 'task-1')));
      const second = unreserved(await broker.requestLease(ANA, request('public', 'task-2')));

      expect([first.access, second.access]).toEqual([a.id, a.id]);
    },
  },
  {
    name: 'com a ocupacao empatada, prefere a conta com mais folga na janela, pelo consumo que o provedor informa',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      const b = anaHas(ports, 'conta-b');
      const now = ports.clock.now();
      const reading = (used: number) => ({
        used: tokenCount(used),
        limit: tokenCount(1000),
        windowEndsAt: instant(now + 3 * HOUR),
        observedAt: now,
      });
      ports.usage.set(a.id, reading(800));
      ports.usage.set(b.id, reading(200));

      expect(unreserved(await broker.requestLease(ANA, request())).access).toBe(b.id);
    },
  },
  {
    name: 'a conta menos ocupada vence a de mais folga na janela',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      const b = anaHas(ports, 'conta-b');
      const now = ports.clock.now();
      ports.usage.set(a.id, {
        used: tokenCount(900),
        limit: tokenCount(1000),
        windowEndsAt: instant(now + HOUR),
        observedAt: now,
      });
      ports.usage.set(b.id, {
        used: tokenCount(0),
        limit: tokenCount(1000),
        windowEndsAt: instant(now + HOUR),
        observedAt: now,
      });
      runsOpenOn(ports, b, 1);

      expect(unreserved(await broker.requestLease(ANA, request())).access).toBe(a.id);
    },
  },

  // ─── Com capacidade declarada: a vaga e reservada ────────────────────────
  {
    name: 'conta com capacidade declarada: a reserva ocupa uma vaga, com prazo, e o segredo so vai no ambiente da execucao',
    async run(broker, ports) {
      const conta = anaHas(ports, 'conta-a', { concurrencyLimit: 2 });

      const lease = reserved(await broker.requestLease(ANA, request()));

      expect(lease.access).toBe(conta.id);
      expect(lease.env).toEqual({ [ENV_VAR]: secretValueOf('conta-a') });
      expect(lease.grantedAt).toBe(ports.clock.now());
      expect(lease.expiresAt).toBe(ports.clock.now() + ports.settings.leaseTtlMs);
      expect(lease.shared).toBe(false);
      expect((await broker.leases()).map((l) => l.id)).toEqual([lease.id]);
    },
  },
  {
    name: 'nem as reservas em curso nem os eventos levam o segredo',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-granted', 'access-broker:lease-returned']);
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });

      const lease = reserved(await broker.requestLease(ANA, request()));
      const active = await broker.leases();
      await broker.returnLease(lease);

      expect(active).toHaveLength(1);
      expect(JSON.stringify([active, seen])).not.toContain(secretValueOf('conta-a'));
    },
  },
  {
    name: 'duas contas com capacidade: cada execucao recebe uma, sem dividir',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 2 });
      anaHas(ports, 'conta-b', { concurrencyLimit: 2 });

      const first = reserved(await broker.requestLease(ANA, request('public', 'task-1')));
      const second = reserved(await broker.requestLease(ANA, request('public', 'task-2')));

      expect(first.access).not.toBe(second.access);
      expect([first.shared, second.shared]).toEqual([false, false]);
    },
  },
  {
    name: 'uma conta com capacidade para duas: a segunda execucao divide a conta',
    async run(broker, ports) {
      const conta = anaHas(ports, 'conta-a', { concurrencyLimit: 2 });

      const first = reserved(await broker.requestLease(ANA, request('public', 'task-1')));
      const second = reserved(await broker.requestLease(ANA, request('public', 'task-2')));

      expect([first.access, second.access]).toEqual([conta.id, conta.id]);
      expect([first.shared, second.shared]).toEqual([false, true]);
    },
  },
  {
    name: 'com a capacidade declarada e sem vaga, o pedido e negado com o motivo',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      reserved(await broker.requestLease(ANA, request('public', 'task-1')));

      const second = denied(await broker.requestLease(ANA, request('public', 'task-2')));

      expect(second.reason.code).toBe('all-at-provider-limit');
    },
  },
  {
    name: 'uma conta cheia nao fecha a porta: a sem capacidade declarada ainda atende',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      const livre = anaHas(ports, 'conta-b');
      const first = reserved(await broker.requestLease(ANA, request('public', 'task-1')));
      expect(first.shared).toBe(false);

      expect(unreserved(await broker.requestLease(ANA, request('public', 'task-2'))).access).toBe(livre.id);
    },
  },
  {
    name: 'devolver libera a vaga: a proxima execucao a recebe sem dividir',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      const first = reserved(await broker.requestLease(ANA, request('public', 'task-1')));

      expect(await broker.returnLease(first)).toEqual({ state: 'returned', id: first.id });
      expect(reserved(await broker.requestLease(ANA, request('public', 'task-2'))).shared).toBe(false);
      expect(await broker.leases()).toHaveLength(1);
    },
  },
  {
    name: 'a reserva vencida libera a vaga sozinha, e devolver depois diz que venceu',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      const old = reserved(await broker.requestLease(ANA, request('public', 'task-1')));
      ports.clock.advance(ports.settings.leaseTtlMs + 1);

      expect(reserved(await broker.requestLease(ANA, request('public', 'task-2'))).shared).toBe(false);
      expect(await broker.returnLease(old)).toEqual({ state: 'expired', id: old.id });
      expect((await broker.leases()).map((l) => l.id)).not.toContain(old.id);
    },
  },
  {
    name: 'ligado, a reserva vencida vira evento, no mais tardar na proxima operacao',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-expired']);
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      const lease = reserved(await broker.requestLease(ANA, request()));

      ports.clock.advance(ports.settings.leaseTtlMs + 1);
      await broker.leases();

      expect(seen.map((e) => e.payload)).toEqual([{ lease: lease.id, access: lease.access }]);
    },
  },

  // ─── A conta fixada pelo plano ───────────────────────────────────────────
  {
    name: 'com a conta fixada, o pedido recebe aquela conta mesmo havendo outra menos ocupada',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      anaHas(ports, 'conta-b');
      runsOpenOn(ports, a, 3);

      expect(unreserved(await broker.requestLease(ANA, { ...request(), access: a.id })).access).toBe(a.id);
    },
  },
  {
    name: 'a conta fixada com capacidade declarada recebe a reserva nela, mesmo havendo outra com mais vaga',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a', { concurrencyLimit: 2 });
      anaHas(ports, 'conta-b', { concurrencyLimit: 2 });
      reserved(await broker.requestLease(ANA, request('public', 'task-1')));

      const pinned = reserved(await broker.requestLease(ANA, { ...request('public', 'task-2'), access: a.id }));

      expect(pinned.access).toBe(a.id);
      expect(pinned.shared).toBe(true);
    },
  },
  {
    name: 'a conta fixada sem liberacao para a sensibilidade e recusada, mesmo havendo outra liberada',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a');
      anaHas(ports, 'conta-b', { clearance: 'sensitive' });

      const result = denied(await broker.requestLease(ANA, { ...request('sensitive'), access: a.id }));

      expect(result.reason.code).toBe('no-cleared-access');
    },
  },
  {
    name: 'a conta fixada e cheia e recusada, mesmo havendo outra com vaga',
    async run(broker, ports) {
      const a = anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      anaHas(ports, 'conta-b');
      reserved(await broker.requestLease(ANA, { ...request('public', 'task-1'), access: a.id }));

      const result = denied(await broker.requestLease(ANA, { ...request('public', 'task-2'), access: a.id }));

      expect(result.reason.code).toBe('all-at-provider-limit');
    },
  },
  {
    name: 'a conta fixada que nao existe para a pessoa e recusada, mesmo havendo outra do tipo, e vira evento',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-denied']);
      anaHas(ports, 'conta-a');
      const alheia = lendable('conta-do-bruno');
      ports.catalog.add(BRUNO, REPO, alheia);
      ports.secrets.set(BRUNO, alheia.secret, 'segredo-do-bruno');

      const inexistente = denied(await broker.requestLease(ANA, { ...request(), access: resourceId('conta-z') }));
      const deOutro = denied(await broker.requestLease(ANA, { ...request(), access: alheia.id }));

      expect([inexistente.reason.code, deOutro.reason.code]).toEqual(['unknown-access', 'unknown-access']);
      expect(seen.map((e) => e.payload.reason.code)).toEqual(['unknown-access', 'unknown-access']);
    },
  },

  // ─── Vale para todo acesso, com ou sem reserva ───────────────────────────
  {
    name: 'task sensivel so recebe acesso liberado para dado sensivel',
    async run(broker, ports) {
      anaHas(ports, 'conta-a');
      const cleared = anaHas(ports, 'conta-b', { clearance: 'sensitive' });

      expect(granted(await broker.requestLease(ANA, request('sensitive'))).access).toBe(cleared.id);
    },
  },
  {
    name: 'sem acesso liberado para a sensibilidade, o pedido e negado com o motivo',
    async run(broker, ports) {
      anaHas(ports, 'conta-a');
      expect(denied(await broker.requestLease(ANA, request('internal'))).reason.code).toBe('no-cleared-access');
    },
  },
  {
    name: 'sem acesso do tipo a vista, o pedido e negado com o motivo, e vira evento',
    async run(broker) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-denied']);

      expect(denied(await broker.requestLease(ANA, request())).reason.code).toBe('no-access-of-kind');
      expect(seen.map((e) => e.payload.reason.code)).toEqual(['no-access-of-kind']);
    },
  },
  {
    name: 'uma conta so e entregue a quem tem a credencial dela na propria guarda',
    async run(broker, ports) {
      const conta = lendable('conta-do-time');
      ports.catalog.add(BRUNO, REPO, conta);

      expect(denied(await broker.requestLease(BRUNO, request())).reason.code).toBe('no-access-of-kind');

      ports.secrets.set(BRUNO, conta.secret, 'segredo-do-time');
      expect(granted(await broker.requestLease(BRUNO, request())).env).toEqual({ [ENV_VAR]: 'segredo-do-time' });
    },
  },
];

export function describeAccessBrokerContract(label: string, create: CreatePlugin<IAccessBroker>): void {
  describeCases(label, create, ACCESS_BROKER_CONTRACT_CASES);
}
