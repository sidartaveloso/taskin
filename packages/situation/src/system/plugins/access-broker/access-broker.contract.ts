import { expect } from 'vitest';
import { type DataClass, instant, resourceId, secretRef, tokenCount } from '../../../use-cases/branded';
import type { LeaseDenied, LeaseGranted } from '../../../use-cases/flows.types';
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

function granted(result: LeaseGranted | LeaseDenied): LeaseGranted {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('granted');
  return result as LeaseGranted;
}

function denied(result: LeaseGranted | LeaseDenied): LeaseDenied {
  expect(result.state).toBe('denied');
  return result as LeaseDenied;
}

const request = (sensitivity: DataClass = 'public', task = 'task-1') => leaseRequest(sensitivity, task);

export const ACCESS_BROKER_CONTRACT_CASES: readonly PluginContractCase<IAccessBroker>[] = [
  ...lifecycleCases<AccessBrokerEvents, IAccessBroker>(async (broker, ports) => {
    anaHas(ports, 'conta-a');
    await broker.requestLease(ANA, request());
    return 'access-broker:lease-granted';
  }, 'access-broker:lease-granted'),
  {
    name: 'o emprestimo entrega o segredo so no ambiente da execucao, com prazo',
    async run(broker, ports) {
      const conta = anaHas(ports, 'conta-a');

      const lease = granted(await broker.requestLease(ANA, request()));

      expect(lease.access).toBe(conta.id);
      expect(lease.env).toEqual({ [ENV_VAR]: secretValueOf('conta-a') });
      expect(lease.grantedAt).toBe(ports.clock.now());
      expect(lease.expiresAt).toBe(ports.clock.now() + ports.settings.leaseTtlMs);
    },
  },
  {
    name: 'nem os emprestimos em curso nem os eventos levam o segredo',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-granted', 'access-broker:lease-returned']);
      anaHas(ports, 'conta-a');

      const lease = granted(await broker.requestLease(ANA, request()));
      const active = await broker.leases();
      await broker.returnLease(lease);

      expect(active).toHaveLength(1);
      expect(JSON.stringify([active, seen])).not.toContain(secretValueOf('conta-a'));
    },
  },
  {
    name: 'duas contas livres: cada execucao recebe uma, sem dividir',
    async run(broker, ports) {
      anaHas(ports, 'conta-a');
      anaHas(ports, 'conta-b');

      const first = granted(await broker.requestLease(ANA, request('public', 'task-1')));
      const second = granted(await broker.requestLease(ANA, request('public', 'task-2')));

      expect(first.access).not.toBe(second.access);
      expect([first.shared, second.shared]).toEqual([false, false]);
    },
  },
  {
    name: 'uma conta so: a segunda execucao divide a conta',
    async run(broker, ports) {
      const conta = anaHas(ports, 'conta-a');

      const first = granted(await broker.requestLease(ANA, request('public', 'task-1')));
      const second = granted(await broker.requestLease(ANA, request('public', 'task-2')));

      expect([first.access, second.access]).toEqual([conta.id, conta.id]);
      expect([first.shared, second.shared]).toEqual([false, true]);
    },
  },
  {
    name: 'prefere a conta com mais folga na janela, pelo consumo que o provedor informa',
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

      expect(granted(await broker.requestLease(ANA, request())).access).toBe(b.id);
    },
  },
  {
    name: 'com o limite do provedor declarado e sem vaga, o pedido e negado com o motivo',
    async run(broker, ports) {
      anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
      granted(await broker.requestLease(ANA, request('public', 'task-1')));

      const second = denied(await broker.requestLease(ANA, request('public', 'task-2')));

      expect(second.reason.code).toBe('all-at-provider-limit');
    },
  },
  {
    name: 'devolver libera a conta: a proxima execucao a recebe sem dividir',
    async run(broker, ports) {
      anaHas(ports, 'conta-a');
      const first = granted(await broker.requestLease(ANA, request('public', 'task-1')));

      expect(await broker.returnLease(first)).toEqual({ state: 'returned', id: first.id });
      expect(granted(await broker.requestLease(ANA, request('public', 'task-2'))).shared).toBe(false);
    },
  },
  {
    name: 'o emprestimo vencido libera a conta sozinho, e devolver depois diz que venceu',
    async run(broker, ports) {
      anaHas(ports, 'conta-a');
      const old = granted(await broker.requestLease(ANA, request('public', 'task-1')));
      ports.clock.advance(ports.settings.leaseTtlMs + 1);

      expect(granted(await broker.requestLease(ANA, request('public', 'task-2'))).shared).toBe(false);
      expect(await broker.returnLease(old)).toEqual({ state: 'expired', id: old.id });
      expect((await broker.leases()).map((l) => l.id)).not.toContain(old.id);
    },
  },
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
    name: 'uma conta so e emprestada a quem tem a credencial dela na propria guarda',
    async run(broker, ports) {
      const conta = lendable('conta-do-time');
      ports.catalog.add(BRUNO, REPO, conta);

      expect(denied(await broker.requestLease(BRUNO, request())).reason.code).toBe('no-access-of-kind');

      ports.secrets.set(BRUNO, conta.secret, 'segredo-do-time');
      expect(granted(await broker.requestLease(BRUNO, request())).env).toEqual({ [ENV_VAR]: 'segredo-do-time' });
    },
  },
  {
    name: 'ligado, o emprestimo vencido vira evento, no mais tardar na proxima operacao',
    async run(broker, ports) {
      await broker.start();
      const seen = recordEvents(broker, ['access-broker:lease-expired']);
      anaHas(ports, 'conta-a');
      const lease = granted(await broker.requestLease(ANA, request()));

      ports.clock.advance(ports.settings.leaseTtlMs + 1);
      await broker.leases();

      expect(seen.map((e) => e.payload)).toEqual([{ lease: lease.id, access: lease.access }]);
    },
  },
];

export function describeAccessBrokerContract(label: string, create: CreatePlugin<IAccessBroker>): void {
  describeCases(label, create, ACCESS_BROKER_CONTRACT_CASES);
}
