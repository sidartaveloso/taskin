import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeInventoryContract } from '../system/plugins/inventory/inventory.contract';
import { describeRunLedgerContract } from '../system/plugins/run-ledger/run-ledger.contract';
import { createFakePluginPorts } from '../system/system.fake-ports';
import { difficulty, repositoryId, resourceId, secretRef, taskRef, tokenCount } from '../use-cases/branded';
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
  createLocalRunLedger(ports, {
    history: join(tempDir(), '.taskin', 'runs.jsonl'),
    machine: join(tempDir(), 'taskin', 'runs.jsonl'),
  }),
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

describe('run-ledger local: o historico do time e o estado da maquina', () => {
  /** Os dois arquivos de um repositorio: o versionado e o desta maquina. */
  const files = (machine = join(tempDir(), 'taskin', 'runs.jsonl')) => ({
    history: join(tempDir(), '.taskin', 'runs.jsonl'),
    machine,
  });
  const outcome = {
    model: 'sonnet',
    found: difficulty(3),
    tokens: tokenCount(10),
    iterations: 1,
    completed: true,
    reworked: false,
  };

  it('outro processo sobre os mesmos arquivos ve a execucao em aberto, e deixa de ver quando ela fecha', async () => {
    const shared = files();
    const ports = createFakePluginPorts();
    const mine = createLocalRunLedger(ports, shared);
    const theirs = createLocalRunLedger(ports, shared);

    const run = await mine.startRun(await mine.planRun(REPO, taskRef('task-1'), difficulty(2)), resourceId('conta-a'));

    expect((await theirs.openRuns()).map((r) => [r.id, r.access])).toEqual([[run.id, 'conta-a']]);
    await mine.finishRun(run, outcome);
    expect(await theirs.openRuns()).toEqual([]);
    expect((await theirs.runs(REPO)).map((r) => r.id)).toEqual([run.id]);
  });

  it('dois processos nao confundem a execucao um do outro: os ids nao se repetem entre eles', async () => {
    const shared = files();
    const ports = createFakePluginPorts();
    const first = createLocalRunLedger(ports, shared);
    const second = createLocalRunLedger(ports, shared);

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
    const ports = createFakePluginPorts();
    const ledger = createLocalRunLedger(ports, files(), { openMaxAgeMs: 60_000 });
    const abandoned = await ledger.startRun(
      await ledger.planRun(REPO, taskRef('task-1'), difficulty(2)),
      resourceId('conta-a'),
    );

    ports.clock.advance(30_000);
    expect((await ledger.openRuns()).map((r) => r.id)).toEqual([abandoned.id]);
    ports.clock.advance(31_000);
    expect(await ledger.openRuns()).toEqual([]);
  });

  it('o estado da maquina vale para todos os repositorios: o consumo e as execucoes em aberto atravessam o historico', async () => {
    const machine = join(tempDir(), 'taskin', 'runs.jsonl');
    const ports = createFakePluginPorts();
    const since = ports.clock.now();
    const here = createLocalRunLedger(ports, files(machine));
    const there = createLocalRunLedger(ports, files(machine));
    const conta = resourceId('conta-a');

    const done = await here.startRun(await here.planRun(REPO, taskRef('task-1'), difficulty(2)), conta);
    await here.finishRun(done, { ...outcome, tokens: tokenCount(70) });
    const open = await there.startRun(
      await there.planRun(repositoryId('outro'), taskRef('task-9'), difficulty(2)),
      conta,
    );

    expect(await there.consumption(conta, since)).toBe(70);
    expect((await here.openRuns()).map((r) => r.id)).toEqual([open.id]);
    expect((await there.runs(repositoryId('outro'))).map((r) => r.id)).toEqual([]);
    expect((await here.runs(REPO)).map((r) => r.id)).toEqual([done.id]);
  });

  it('o arquivo versionado leva so o que calibra; a conta e os horarios ficam no estado da maquina', async () => {
    const shared = files();
    const ports = createFakePluginPorts();
    const ledger = createLocalRunLedger(ports, shared);
    const conta = resourceId('conta-da-pessoa');

    const run = await ledger.startRun(await ledger.planRun(REPO, taskRef('task-1'), difficulty(2)), conta);
    ports.clock.advance(60_000);
    await ledger.finishRun(run, outcome);

    const team = readFileSync(shared.history, 'utf8').trim().split('\n');
    expect(team).toHaveLength(1);
    expect(Object.keys(JSON.parse(team[0] ?? '{}')).sort()).toEqual(
      [
        'completed',
        'duration',
        'estimated',
        'found',
        'id',
        'iterations',
        'model',
        'repository',
        'reworked',
        'task',
        'tokens',
      ].sort(),
    );
    expect(team.join('\n')).not.toContain('conta-da-pessoa');
    const machine = readFileSync(shared.machine, 'utf8');
    expect(machine).toContain('conta-da-pessoa');
    expect(machine).toMatch(/\d{10,}/);
  });
});

describe('inventory local: o id da conta', () => {
  it('a conta da camada da pessoa tem o mesmo id em repositorios diferentes, e a do repositorio nao se confunde com ela', async () => {
    const personalResources = join(tempDir(), 'config', 'resources.json');
    const open = async (repository: string, offers: string[]) => {
      const dir = tempDir();
      const options = {
        repository: repositoryId(repository),
        repositoryConfig: join(dir, '.taskin.json'),
        personalResources,
      };
      writeFileSync(
        options.repositoryConfig,
        JSON.stringify({ resources: { offers: offers.map((name) => account(name)) } }),
      );
      return createLocalInventory(createFakePluginPorts(), options);
    };

    const first = await open('repo-um', ['conta-do-time', 'outra']);
    const own = account('conta-pessoal');
    const id = await first.declare(ANA, own);
    const second = await open('repo-dois', ['so-esta']);
    await second.release(ANA, id, repositoryId('repo-dois'));

    const idsIn = async (inventory: typeof first, repository: string) =>
      (await inventory.accesses(ANA, repositoryId(repository), own.accessKind)).map((a) => [a.name, a.id]);
    const inSecond = new Map(await idsIn(second, 'repo-dois'));

    expect(inSecond.get('conta-pessoal')).toBe(id);
    expect(inSecond.get('so-esta')).not.toBe(id);
    expect(new Set((await idsIn(first, 'repo-um')).map(([, i]) => i)).size).toBe(2);
  });
});

describe('privacidade', () => {
  it('runs.jsonl versionado nao leva conta da camada da pessoa nem horario do dia, e a camada do repositorio nao leva endereco, hostname nem segredo', async () => {
    const dir = tempDir();
    const options = paths(dir);
    const history = join(dir, '.taskin', 'runs.jsonl');
    const machineState = join(tempDir(), 'taskin', 'runs.jsonl');
    const SECRET = 'sk-valor-secreto-123';
    const PERSONAL = 'claude-conta-pessoal-da-ana';
    const secrets = createEnvSecretStore({ CONTA_DO_TIME: SECRET, CONTA_PESSOAL: SECRET });
    const ports = createFakePluginPorts();
    const inventory = createLocalInventory({ ...ports, secrets }, options);
    const team = account('conta-do-time', { secret: secretRef('env:CONTA_DO_TIME') });
    const personal = account(PERSONAL, { secret: secretRef('env:CONTA_PESSOAL') });
    await inventory.offer(REPO, team);
    await inventory.offer(REPO, machine('servidor-1', 'docker'));
    const personalId = await inventory.declare(ANA, personal);
    await inventory.release(ANA, personalId, REPO);
    const accesses = await inventory.accesses(ANA, REPO, team.accessKind);

    const ledger = createLocalRunLedger(ports, { history, machine: machineState });
    for (const access of accesses) {
      const run = await ledger.startRun(await ledger.planRun(REPO, taskRef('task-1'), difficulty(2)), access.id);
      ports.clock.advance(61_000);
      await ledger.finishRun(run, {
        model: 'sonnet',
        found: difficulty(3),
        tokens: tokenCount(10),
        iterations: 1,
        completed: true,
        reworked: false,
      });
    }

    const lines = readFileSync(history, 'utf8').trim().split('\n');
    expect(accesses.map((a) => a.name)).toContain(PERSONAL);
    expect(lines).toHaveLength(accesses.length);
    const written = `${lines.join('\n')}\n${readFileSync(options.repositoryConfig, 'utf8')}`;
    for (const access of accesses) {
      expect(lines.join('\n')).not.toContain(access.name);
      expect(lines.join('\n')).not.toContain(String(access.id));
    }
    expect(lines.join('\n')).not.toMatch(/\d{10,}/);
    expect(written).not.toContain(SECRET);
    expect(written).not.toMatch(/\d{1,3}(\.\d{1,3}){3}/);
    expect(written).not.toMatch(/https?:\/\//);
    expect(written).not.toContain(hostname());
    expect(readFileSync(machineState, 'utf8')).not.toContain(SECRET);
  });
});
