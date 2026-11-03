import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLocalInventory } from '../local/inventory.local';
import { localPlanResources } from '../local/plan.local';
import { createLocalRunLedger } from '../local/run-ledger.local';
import { createEnvSecretStore } from '../local/secret-store.env';
import { createFakePluginPorts } from '../system/system.fake-ports';
import { secretRef } from '../use-cases/branded';
import { FakeClock } from '../use-cases/fake-ports';
import { ANA, account, CLAUDE_CODE, machine, REPO } from '../use-cases/scenarios';
import { dependenciesOf, type PlanTaskInput } from './build-problem';
import { buildPlanReport, PLAN_REPORT_VERSION, renderPlan } from './plan-report';
import { DEFAULT_HORIZON_HOURS, DEFAULT_WEIGHTS, readSchedulingSettings } from './scheduling-settings';

const HOUR = 60 * 60 * 1000;

interface Fixture {
  readonly scheduling?: unknown;
  /** O historico do time, o `.taskin/runs.jsonl` versionado. */
  readonly runs?: readonly object[];
  /** O que cada conta gastou, no estado desta maquina, uma hora antes do relogio falso. */
  readonly spent?: Readonly<Record<string, number>>;
  /** Contas da camada da pessoa (da Ana), liberadas para o repositorio, com os ajustes ao lado da conta. */
  readonly personal?: readonly { readonly name: string; readonly scheduling?: object }[];
}

/** Uma pasta temporaria com o `.taskin.json`, a camada da pessoa e o registro. */
function project(fixture: Fixture = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'taskin-plan-'));
  const paths = {
    repository: REPO,
    repositoryConfig: join(dir, '.taskin.json'),
    personalResources: join(dir, 'config', 'resources.json'),
  };
  const history = join(dir, '.taskin', 'runs.jsonl');
  const machineState = join(dir, 'state', 'taskin', 'runs.jsonl');
  writeFileSync(
    paths.repositoryConfig,
    JSON.stringify({
      resources: {
        offers: [
          machine('servidor-1', 'docker'),
          account('conta-a', { secret: secretRef('env:CONTA_A') }),
          account('conta-b', { secret: secretRef('env:CONTA_B') }),
        ],
        scheduling: fixture.scheduling ?? {
          accesses: {
            'conta-a': { model: 'opus', completionRate: 0.95, quota: 200_000, windowHours: 5 },
            'conta-b': { model: 'sonnet', completionRate: 0.6 },
          },
          movable: { 'android-sdk': 2 },
        },
      },
    }),
  );
  if (fixture.personal !== undefined) {
    mkdirSync(join(dir, 'config'), { recursive: true });
    writeFileSync(
      paths.personalResources,
      JSON.stringify({
        [ANA]: fixture.personal.map((p) => ({
          declaration: account(p.name, { secret: secretRef('env:CONTA_PESSOAL') }),
          releasedTo: [REPO],
          ...(p.scheduling === undefined ? {} : { scheduling: p.scheduling }),
        })),
      }),
    );
  }
  if (fixture.runs !== undefined) {
    mkdirSync(join(dir, '.taskin'), { recursive: true });
    writeFileSync(history, fixture.runs.map((r) => `${JSON.stringify(r)}\n`).join(''));
  }
  return { dir, paths, files: { history, machine: machineState } };
}

async function plan(fixture: Fixture, tasks: readonly PlanTaskInput[]) {
  return (await planWithWarnings(fixture, tasks)).report;
}

async function planWithWarnings(fixture: Fixture, tasks: readonly PlanTaskInput[]) {
  const { paths, files } = project(fixture);
  const clock = new FakeClock();
  const ports = {
    ...createFakePluginPorts(),
    clock,
    secrets: createEnvSecretStore({ CONTA_A: 'a', CONTA_B: 'b', CONTA_PESSOAL: 'p' }),
  };
  const inventory = createLocalInventory(ports, paths);
  const ids = new Map((await inventory.accesses(ANA, REPO, CLAUDE_CODE)).map((a) => [a.name, String(a.id)]));
  if (fixture.spent !== undefined) {
    mkdirSync(join(files.machine, '..'), { recursive: true });
    const finishedAt = clock.now() - HOUR;
    writeFileSync(
      files.machine,
      Object.entries(fixture.spent)
        .map(([name, tokens]) =>
          JSON.stringify({ state: 'finished', id: `run-${name}`, access: ids.get(name), tokens, finishedAt }),
        )
        .map((line) => `${line}\n`)
        .join(''),
    );
  }
  const resources = await localPlanResources({
    inventory,
    ledger: createLocalRunLedger({ clock }, files),
    clock,
    person: ANA,
    repository: REPO,
    view: await inventory.view(ANA, REPO),
    paths,
  });
  const report = await buildPlanReport({ repository: 'repo-a', now: clock.now(), tasks, ...resources });
  return { report, warnings: resources.warnings, repositoryConfig: readFileSync(paths.repositoryConfig, 'utf8') };
}

const task = (id: string, extra: Partial<PlanTaskInput> = {}): PlanTaskInput => ({
  id,
  title: `task ${id}`,
  requires: [],
  ...extra,
});

/** Uma execucao fechada no historico do time: o modelo, e nada da conta nem de horario. */
function record(model: string, tokens: number, completed = true) {
  return {
    id: `run-${model}-${tokens}`,
    repository: REPO,
    task: '1',
    estimated: 3,
    found: 3,
    model,
    tokens,
    iterations: 1,
    completed,
    reworked: false,
    duration: HOUR,
  };
}

describe('taskin plan: o problema montado do que existe', () => {
  it('sem historico, usa as estimativas declaradas e o diz', async () => {
    const report = await plan({}, [task('1')]);
    expect(report.history).toBe(false);
    expect(report.plan.assignments).toHaveLength(1);
    expect(report.resources[report.plan.assignments[0]!.access]?.name).toBe('conta-a');
    expect(report.plan.problem.tasks[0]?.estimatedTokens).toBe(100_000);
    expect(renderPlan(report, 'text')).toContain('No run history yet: using the declared estimates.');
  });

  it('uma conta perto do limite empurra a task para outro acesso', async () => {
    const report = await plan({ spent: { 'conta-a': 195_000 } }, [task('1')]);
    const access = report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-a');
    expect(access?.remaining).toBe(5_000);
    const [assignment] = report.plan.assignments;
    expect(report.resources[assignment!.access]).toEqual({ name: 'conta-b' });
    expect(assignment!.model).toBe('sonnet');
    expect(renderPlan(report, 'text')).toContain('#1 task 1 → conta-b (sonnet) on servidor-1');
  });

  it('o historico do time da a taxa de conclusao por modelo e os tokens por dificuldade', async () => {
    const report = await plan({ runs: [record('sonnet', 30_000)] }, [task('1')]);
    expect(report.history).toBe(true);
    const contaB = report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-b');
    const contaA = report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-a');
    expect(contaB?.models[0]?.completionRate).toBe(1);
    expect(contaA?.models[0]?.completionRate).toBe(0.95);
    expect(report.plan.problem.tasks[0]?.estimatedTokens).toBe(30_000);
  });

  it('duas contas do mesmo modelo dividem a taxa de conclusao: o historico e do modelo, nao da conta', async () => {
    const scheduling = { accesses: { 'conta-a': { model: 'sonnet' }, 'conta-b': { model: 'sonnet' } } };
    const report = await plan({ scheduling, runs: [record('sonnet', 10_000, false)] }, [task('1')]);
    const rates = report.plan.problem.accesses.flatMap((a) => a.models.map((m) => m.completionRate));
    expect(rates).toEqual([0, 0]);
  });

  it('sem modelo declarado, o historico vale pelo tipo do acesso', async () => {
    const report = await plan({ scheduling: {}, runs: [record(String(CLAUDE_CODE), 10_000, false)] }, [task('1')]);
    expect(report.plan.problem.accesses.flatMap((a) => a.models.map((m) => m.completionRate))).toEqual([0, 0]);
  });

  it('o consumo da janela vem do estado da maquina, nao do historico do time', async () => {
    const heavy = [record('opus', 190_000)];
    const fromTeam = await plan({ runs: heavy }, [task('1')]);
    const fromMachine = await plan({ spent: { 'conta-a': 190_000 } }, [task('1')]);
    const remaining = (report: typeof fromTeam) =>
      report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-a')?.remaining;
    expect(remaining(fromTeam)).toBe(200_000);
    expect(remaining(fromMachine)).toBe(10_000);
  });

  it('um requisito fixo ausente adia com fixed-requirement; o movel vira custo de preparo', async () => {
    const report = await plan({}, [task('1', { requires: ['gpu'] }), task('2', { requires: ['android-sdk'] })]);
    expect(report.deferred).toEqual([{ task: '1', reason: 'fixed-requirement' }]);
    expect(report.plan.assignments.map((a) => a.task)).toEqual(['2']);
    expect(report.score.terms.setup).toBe(2);
    expect(renderPlan(report, 'text')).toMatch(/Deferred:\n {2}#1 task 1 — fixed-requirement/);
  });

  it('a mesma entrada da o mesmo plano', async () => {
    const tasks = [task('3', { order: 2 }), task('1', { order: 1 }), task('2', { difficulty: 5 })];
    const first = await plan({ runs: [record('opus', 10_000)] }, tasks);
    const second = await plan({ runs: [record('opus', 10_000)] }, tasks);
    expect(renderPlan(second, 'json')).toBe(renderPlan(first, 'json'));
  });

  it('a fila vira valor e "Depende da task-N" vira dependencia entre as abertas', async () => {
    const report = await plan({}, [
      task('2', { order: 1, description: 'Depende da task-1. Depende da task-099.' }),
      task('1', { order: 2 }),
    ]);
    const [two, one] = report.plan.problem.tasks;
    expect(two).toMatchObject({ task: '2', value: 2, dependsOn: ['1'] });
    expect(one).toMatchObject({ task: '1', value: 1, dependsOn: [] });
    const at = Object.fromEntries(report.plan.assignments.map((a) => [a.task, a.at]));
    expect(at['1']).toBeLessThan(at['2']!);
  });

  it('o que so caberia depois do horizonte fica fora do plano', async () => {
    const report = await plan({ scheduling: { horizonHours: 1 } }, [task('1'), task('2')]);
    expect(report.plan.assignments).toHaveLength(1);
    expect(report.beyondHorizon).toHaveLength(1);
    expect(renderPlan(report, 'text')).toContain('Beyond the 1h horizon:');
  });

  it('sem acesso disponivel, o texto diz por que nada cabe', async () => {
    const report = await buildPlanReport({
      repository: 'repo-a',
      now: new FakeClock().now(),
      tasks: [task('1')],
      accesses: [],
      machines: [],
      runs: [],
      spent: {},
      settings: readSchedulingSettings(join(tmpdir(), 'nao-existe', '.taskin.json')),
    });
    const text = renderPlan(report, 'text');
    expect(text).toContain('No LLM access is available here');
    expect(text).toContain('No machine is available here.');
    expect(text).toContain('Nothing fits right now.');
  });

  it('o JSON e o SuggestedPlan com version', async () => {
    const json = JSON.parse(renderPlan(await plan({}, [task('1')]), 'json'));
    expect(json.version).toBe(PLAN_REPORT_VERSION);
    expect(Object.keys(json)).toEqual(expect.arrayContaining(['plan', 'score', 'deferred']));
  });
});

describe('taskin plan: uma conta oferece varios modelos', () => {
  const twoModels = {
    accesses: {
      'conta-a': {
        models: [
          { name: 'opus', competence: 5, costPerThousandTokens: 2, completionRate: 0.9 },
          { name: 'haiku', competence: 2, costPerThousandTokens: 0.5, completionRate: 0.9 },
        ],
      },
      'conta-b': { model: 'sonnet', competence: 1 },
    },
  };
  const contaOf = (report: Awaited<ReturnType<typeof plan>>, name: string) =>
    report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === name);

  it('cada task vai ao modelo da conta que a cobre pelo menor custo, e o texto e o JSON dizem conta e modelo', async () => {
    const report = await plan({ scheduling: twoModels }, [
      task('1', { order: 1, difficulty: 4 }),
      task('2', { order: 2, difficulty: 2 }),
    ]);

    const conta = contaOf(report, 'conta-a');
    const byTask = Object.fromEntries(report.plan.assignments.map((a) => [a.task, [a.access, a.model]]));
    expect(byTask).toEqual({ '1': [conta?.id, 'opus'], '2': [conta?.id, 'haiku'] });

    const text = renderPlan(report, 'text');
    expect(text).toContain('#1 task 1 → conta-a (opus) on servidor-1');
    expect(text).toContain('#2 task 2 → conta-a (haiku) on servidor-1');

    const json = JSON.parse(renderPlan(report, 'json'));
    expect(json.plan.assignments.map((a: { model: string }) => a.model)).toEqual(['opus', 'haiku']);
  });

  it('o model de hoje continua valendo como a lista de um modelo so', async () => {
    const report = await plan({}, [task('1')]);
    expect(contaOf(report, 'conta-b')?.models).toEqual([
      { name: 'sonnet', competence: 3, completionRate: 0.6, costPerThousandTokens: 0 },
    ]);
  });

  it('o historico do time calibra cada modelo da conta pelo nome dele', async () => {
    const report = await plan({ scheduling: twoModels, runs: [record('haiku', 10_000, false)] }, [task('1')]);
    expect(contaOf(report, 'conta-a')?.models.map((m) => [m.name, m.completionRate])).toEqual([
      ['opus', 0.9],
      ['haiku', 0],
    ]);
  });

  it('declarar model e models na mesma conta e recusado', () => {
    const { paths } = project({
      scheduling: { accesses: { 'conta-a': { model: 'opus', models: [{ name: 'haiku' }] } } },
    });
    expect(() => readSchedulingSettings(paths.repositoryConfig)).toThrow(/model/);
  });
});

describe('taskin plan: os ajustes de uma conta moram na camada da pessoa', () => {
  const PERSONAL = 'claude-conta-pessoal-da-ana';
  const personalOf = (report: Awaited<ReturnType<typeof plan>>) =>
    report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === PERSONAL);

  it('o modelo e a cota declarados so no arquivo da pessoa chegam ao plano, e o repositorio nao ve o nome da conta', async () => {
    const { report, warnings, repositoryConfig } = await planWithWarnings(
      {
        personal: [{ name: PERSONAL, scheduling: { model: 'haiku', quota: 50_000, completionRate: 0.5 } }],
        spent: { [PERSONAL]: 45_000 },
      },
      [task('1')],
    );

    expect(personalOf(report)?.remaining).toBe(5_000);
    expect(personalOf(report)?.models).toEqual([
      { name: 'haiku', competence: 3, completionRate: 0.5, costPerThousandTokens: 0 },
    ]);
    expect(report.resources[personalOf(report)?.id ?? '']).toEqual({ name: PERSONAL });
    expect(warnings).toEqual([]);
    expect(repositoryConfig).not.toContain(PERSONAL);
  });

  it('a conta do repositorio segue pelo .taskin.json, e a da pessoa pelo arquivo dela, na mesma rodada', async () => {
    const report = await plan({ personal: [{ name: PERSONAL, scheduling: { quota: 70_000 } }] }, [task('1')]);

    const quota = (name: string) =>
      report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === name)?.remaining;
    expect(quota('conta-a')).toBe(200_000);
    expect(quota(PERSONAL)).toBe(70_000);
  });

  it('o .taskin.json que cita uma conta da camada da pessoa e avisado, e o ajuste dele nao vale para ela', async () => {
    const { report, warnings } = await planWithWarnings(
      {
        scheduling: { accesses: { [PERSONAL]: { quota: 1_000, model: 'opus' }, 'conta-a': { quota: 200_000 } } },
        personal: [{ name: PERSONAL, scheduling: { quota: 70_000 } }],
      },
      [task('1')],
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/personal/i);
    expect(warnings[0]).toContain(PERSONAL);
    expect(warnings[0]).toContain('resources.json');
    expect(personalOf(report)?.remaining).toBe(70_000);
  });

  it('a conta da pessoa declara os modelos dela no arquivo dela', async () => {
    const report = await plan(
      {
        personal: [{ name: PERSONAL, scheduling: { models: [{ name: 'haiku' }, { name: 'sonnet', competence: 4 }] } }],
      },
      [task('1')],
    );

    expect(personalOf(report)?.models.map((m) => [m.name, m.competence])).toEqual([
      ['haiku', 3],
      ['sonnet', 4],
    ]);
  });

  it('a conta do repositorio citada no .taskin.json nao gera aviso', async () => {
    const { warnings } = await planWithWarnings({ personal: [{ name: PERSONAL }] }, [task('1')]);
    expect(warnings).toEqual([]);
  });
});

describe('resources.scheduling', () => {
  it('sem a chave, os pesos e o horizonte padrao', () => {
    const { paths } = project({ scheduling: {} });
    const settings = readSchedulingSettings(paths.repositoryConfig);
    expect(settings.weights).toEqual(DEFAULT_WEIGHTS);
    expect(settings.horizonHours).toBe(DEFAULT_HORIZON_HOURS);
    expect(readSchedulingSettings(join(tmpdir(), 'nao-existe', '.taskin.json')).weights).toEqual(DEFAULT_WEIGHTS);
  });

  it('os pesos lidos do .taskin.json completam os padroes', () => {
    const { paths } = project({ scheduling: { weights: { money: 3 }, horizonHours: 8 } });
    const settings = readSchedulingSettings(paths.repositoryConfig);
    expect(settings.weights).toEqual({ ...DEFAULT_WEIGHTS, money: 3 });
    expect(settings.horizonHours).toBe(8);
  });

  it('o inventario regrava a camada do repositorio sem apagar resources.scheduling', async () => {
    const { paths } = project({ scheduling: { horizonHours: 8 } });
    await createLocalInventory(createFakePluginPorts(), paths).offer(REPO, machine('servidor-2'));
    const config = JSON.parse(readFileSync(paths.repositoryConfig, 'utf8'));
    expect(config.resources.scheduling).toEqual({ horizonHours: 8 });
    expect(config.resources.offers).toHaveLength(4);
  });
});

describe('dependenciesOf', () => {
  it('le cada "Depende da task-N" uma vez, sem zeros a esquerda', () => {
    expect(dependenciesOf('Depende da task-079, que define. Depende da task-79. Depende da task-222')).toEqual([
      '79',
      '222',
    ]);
    expect(dependenciesOf(undefined)).toEqual([]);
  });
});
