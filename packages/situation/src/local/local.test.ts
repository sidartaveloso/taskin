import { mkdtempSync, readFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeInventoryContract } from '../system/plugins/inventory/inventory.contract';
import { describeRunLedgerContract } from '../system/plugins/run-ledger/run-ledger.contract';
import { createFakePluginPorts } from '../system/system.fake-ports';
import { difficulty, resourceId, secretRef, taskRef, tokenCount } from '../use-cases/branded';
import { FakeClock } from '../use-cases/fake-ports';
import { ANA, account, machine, REPO } from '../use-cases/scenarios';
import { createLocalInventory } from './inventory.local';
import { createLocalMachineProbe } from './machine-probe.local';
import { createLocalRunLedger } from './run-ledger.local';
import { createEnvSecretStore } from './secret-store.env';

const tempDir = () => mkdtempSync(join(tmpdir(), 'taskin-situation-'));

function paths(dir = tempDir()) {
  return {
    repository: REPO,
    repositoryConfig: join(dir, '.taskin.json'),
    personalResources: join(dir, 'config', 'resources.json'),
  };
}

describeInventoryContract('inventory local', (ports) => createLocalInventory(ports, paths()));
describeRunLedgerContract('run-ledger local', (ports) =>
  createLocalRunLedger(ports, join(tempDir(), '.taskin', 'runs.jsonl')),
);

describe('inventory local: persistencia', () => {
  it('as duas camadas sobrevivem a uma nova instancia sobre os mesmos arquivos', async () => {
    const options = paths();
    const first = createLocalInventory(createFakePluginPorts(), options);
    await first.offer(REPO, machine('servidor-1', 'docker'));
    const desktop = await first.declare(ANA, machine('desktop', 'gpu'));
    await first.release(ANA, desktop, REPO);

    const second = createLocalInventory(createFakePluginPorts(), options);
    const names = (await second.view(ANA, REPO)).resources.map((r) => [r.name, r.layer]).sort();
    expect(names).toEqual([
      ['desktop', 'personal'],
      ['servidor-1', 'repository'],
    ]);
  });

  it('a camada do repositorio mora na chave resources e preserva o resto do .taskin.json', async () => {
    const options = paths();
    const { writeFileSync } = await import('node:fs');
    writeFileSync(options.repositoryConfig, JSON.stringify({ name: 'projeto' }));
    const inventory = createLocalInventory(createFakePluginPorts(), options);
    await inventory.offer(REPO, machine('servidor-1', 'docker'));
    const config = JSON.parse(readFileSync(options.repositoryConfig, 'utf8'));
    expect(config.name).toBe('projeto');
    expect(config.resources.offers[0].name).toBe('servidor-1');
  });
});

describe('guarda por variavel de ambiente', () => {
  const store = createEnvSecretStore({ CONTA: 'valor', VAZIA: '' });
  it('le env:NOME do ambiente', async () => {
    expect(await store.read(ANA, secretRef('env:CONTA'))).toBe('valor');
  });
  it('variavel ausente ou vazia, e outras guardas, nao tem segredo', async () => {
    expect(await store.read(ANA, secretRef('env:NADA'))).toBeUndefined();
    expect(await store.read(ANA, secretRef('env:VAZIA'))).toBeUndefined();
    expect(await store.read(ANA, secretRef('op://cofre/item'))).toBeUndefined();
  });
});

describe('sondagem desta maquina', () => {
  const self = resourceId('notebook');
  const clock = new FakeClock();

  it('cada fato vem datado pelo relogio, e so o que o comando confirma entra', async () => {
    const probe = createLocalMachineProbe({
      clock,
      machine: self,
      env: { ANDROID_HOME: '/sdk' },
      platform: () => 'linux',
      sandcastleImage: 'sandcastle:taskin',
      run: async (command, args) => command === 'docker' || (command === 'java' && args[0] === '-version'),
    });
    const facts = await probe.probe(self);
    expect(facts?.observedAt).toBe(clock.now());
    expect(facts?.capabilities.map(String).sort()).toEqual([
      'android-sdk',
      'docker',
      'java',
      'os-linux',
      'sandcastle-image',
    ]);
  });

  it('comando que falha vira capacidade ausente, nao erro', async () => {
    const probe = createLocalMachineProbe({
      clock,
      machine: self,
      env: {},
      platform: () => 'darwin',
      run: async () => false,
    });
    expect((await probe.probe(self))?.capabilities.map(String)).toEqual(['os-darwin']);
  });

  it('outra maquina nao responde', async () => {
    const probe = createLocalMachineProbe({ clock, machine: self, run: async () => true });
    expect(await probe.probe(resourceId('servidor-1'))).toBeUndefined();
  });
});

describe('run-ledger local: o arquivo de execucoes', () => {
  const runsFile = () => join(tempDir(), '.taskin', 'runs.jsonl');
  const outcome = {
    found: difficulty(3),
    tokens: tokenCount(10),
    iterations: 1,
    completed: true,
    reworked: false,
  };

  it('outro processo sobre o mesmo arquivo ve a execucao em aberto, e deixa de ver quando ela fecha', async () => {
    const file = runsFile();
    const ports = createFakePluginPorts();
    const mine = createLocalRunLedger(ports, file);
    const theirs = createLocalRunLedger(ports, file);

    const run = await mine.startRun(await mine.planRun(REPO, taskRef('task-1'), difficulty(2)), resourceId('conta-a'));

    expect((await theirs.openRuns()).map((r) => [r.id, r.access])).toEqual([[run.id, 'conta-a']]);
    await mine.finishRun(run, outcome);
    expect(await theirs.openRuns()).toEqual([]);
    expect((await theirs.runs(REPO)).map((r) => r.id)).toEqual([run.id]);
  });

  it('dois processos nao confundem a execucao um do outro: os ids nao se repetem entre eles', async () => {
    const file = runsFile();
    const ports = createFakePluginPorts();
    const first = createLocalRunLedger(ports, file);
    const second = createLocalRunLedger(ports, file);

    const a = await first.startRun(await first.planRun(REPO, taskRef('task-1'), difficulty(2)), resourceId('conta-a'));
    const b = await second.startRun(
      await second.planRun(REPO, taskRef('task-2'), difficulty(2)),
      resourceId('conta-a'),
    );
    await second.finishRun(b, outcome);

    expect(a.id).not.toBe(b.id);
    expect((await first.openRuns()).map((r) => r.id)).toEqual([a.id]);
  });

  it('a execucao que ficou aberta alem do horizonte, porque o processo morreu, deixa de contar', async () => {
    const file = runsFile();
    const ports = createFakePluginPorts();
    const ledger = createLocalRunLedger(ports, file, { openMaxAgeMs: 60_000 });
    const abandoned = await ledger.startRun(
      await ledger.planRun(REPO, taskRef('task-1'), difficulty(2)),
      resourceId('conta-a'),
    );

    ports.clock.advance(30_000);
    expect((await ledger.openRuns()).map((r) => r.id)).toEqual([abandoned.id]);
    ports.clock.advance(31_000);
    expect(await ledger.openRuns()).toEqual([]);
  });
});

describe('privacidade', () => {
  it('runs.jsonl e a camada do repositorio nao levam endereco, hostname nem valor de segredo', async () => {
    const dir = tempDir();
    const options = paths(dir);
    const runsFile = join(dir, '.taskin', 'runs.jsonl');
    const SECRET = 'sk-valor-secreto-123';
    const secrets = createEnvSecretStore({ CONTA_DO_TIME: SECRET });
    const ports = createFakePluginPorts();
    const inventory = createLocalInventory({ ...ports, secrets }, options);
    const declaration = account('conta-do-time', { secret: secretRef('env:CONTA_DO_TIME') });
    await inventory.offer(REPO, declaration);
    await inventory.offer(REPO, machine('servidor-1', 'docker'));
    const [view] = (await inventory.accesses(ANA, REPO, declaration.accessKind)).map((a) => a.id);

    const ledger = createLocalRunLedger(ports, runsFile);
    const planned = await ledger.planRun(REPO, taskRef('task-1'), difficulty(2));
    const run = await ledger.startRun(planned, view ?? resourceId('conta-do-time'));
    await ledger.finishRun(run, {
      found: difficulty(3),
      tokens: tokenCount(10),
      iterations: 1,
      completed: true,
      reworked: false,
    });

    const lines = readFileSync(runsFile, 'utf8').trim().split('\n');
    expect(lines.map((line) => JSON.parse(line).state)).toEqual(['started', 'finished']);
    const written = `${lines.join('\n')}\n${readFileSync(options.repositoryConfig, 'utf8')}`;
    expect(written).not.toContain(SECRET);
    expect(written).not.toMatch(/\d{1,3}(\.\d{1,3}){3}/);
    expect(written).not.toMatch(/https?:\/\//);
    expect(written).not.toContain(hostname());
  });
});
