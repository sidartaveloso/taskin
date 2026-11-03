import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeAccessBrokerContract } from '../system/plugins/access-broker/access-broker.contract';
import type { LendableAccess } from '../system/plugins/access-broker/access-broker.types';
import { createFakePluginPorts, type FakePluginPorts } from '../system/system.fake-ports';
import { resourceId, secretRef } from '../use-cases/branded';
import { ANA, CLAUDE_CODE, leaseRequest, REPO, secretValueOf } from '../use-cases/scenarios';
import { createLocalAccessBroker, taskinStateDir } from './access-broker.local';

const leasesFile = () => join(mkdtempSync(join(tmpdir(), 'taskin-leases-')), 'taskin', 'leases.json');

describeAccessBrokerContract('access-broker local', (ports) => createLocalAccessBroker(ports, leasesFile()));

function anaHas(ports: FakePluginPorts, name: string, options: Partial<LendableAccess> = {}): LendableAccess {
  const access: LendableAccess = {
    id: resourceId(name),
    name,
    accessKind: CLAUDE_CODE,
    secret: secretRef(`env:${name}`),
    envVar: 'CLAUDE_CODE_OAUTH_TOKEN',
    clearance: 'public',
    ...options,
  };
  ports.catalog.add(ANA, REPO, access);
  ports.secrets.set(ANA, access.secret, secretValueOf(name));
  return access;
}

describe('access-broker local: o arquivo de estado', () => {
  it('dois brokers sobre o mesmo arquivo dividem as contas, como dois processos', async () => {
    const file = leasesFile();
    const ports = createFakePluginPorts();
    anaHas(ports, 'conta-a');
    anaHas(ports, 'conta-b');
    const first = createLocalAccessBroker(ports, file);
    const second = createLocalAccessBroker(ports, file);

    const [a, b] = await Promise.all([
      first.requestLease(ANA, leaseRequest('public', 'task-1')),
      second.requestLease(ANA, leaseRequest('public', 'task-2')),
    ]);

    expect([a.state, b.state]).toEqual(['granted', 'granted']);
    if (a.state !== 'granted' || b.state !== 'granted') return;
    expect(a.access).not.toBe(b.access);
    expect(a.id).not.toBe(b.id);
    expect((await second.leases()).map((l) => l.task).sort()).toEqual(['task-1', 'task-2']);

    expect(await second.returnLease(a)).toEqual({ state: 'returned', id: a.id });
    expect((await first.leases()).map((l) => l.id)).toEqual([b.id]);
  });

  it('muitos pedidos ao mesmo tempo, com o limite do provedor: so um recebe a vaga', async () => {
    const file = leasesFile();
    const ports = createFakePluginPorts();
    anaHas(ports, 'conta-a', { concurrencyLimit: 1 });
    const brokers = Array.from({ length: 6 }, () => createLocalAccessBroker(ports, file));

    const results = await Promise.all(
      brokers.map((broker, i) => broker.requestLease(ANA, leaseRequest('public', `task-${i}`))),
    );

    expect(results.filter((r) => r.state === 'granted')).toHaveLength(1);
  });

  it('o arquivo guarda o nome logico e os prazos, nunca o segredo', async () => {
    const file = leasesFile();
    const ports = createFakePluginPorts();
    anaHas(ports, 'conta-a');
    const broker = createLocalAccessBroker(ports, file);

    const lease = await broker.requestLease(ANA, leaseRequest());

    expect(lease.state).toBe('granted');
    const stored = readFileSync(file, 'utf8');
    expect(stored).toContain('conta-a');
    expect(stored).not.toContain(secretValueOf('conta-a'));
  });

  it('trava deixada por um processo que ja morreu nao prende ninguem', async () => {
    const file = leasesFile();
    const ports = createFakePluginPorts();
    anaHas(ports, 'conta-a');
    const broker = createLocalAccessBroker(ports, file, { timeoutMs: 500 });
    await broker.leases();
    writeFileSync(`${file}.lock`, '999999999\n');

    expect((await broker.requestLease(ANA, leaseRequest())).state).toBe('granted');
  });

  it('o diretorio de estado segue XDG_STATE_HOME, e sem ele ~/.local/state', () => {
    expect(taskinStateDir({ XDG_STATE_HOME: '/estado' }, '/casa')).toBe(join('/estado', 'taskin'));
    expect(taskinStateDir({}, '/casa')).toBe(join('/casa', '.local', 'state', 'taskin'));
  });
});
