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
import { ANA, account, machine, REPO } from '../use-cases/scenarios';
import { dependenciesOf, type PlanTaskInput } from './build-problem';
import { buildPlanReport, PLAN_REPORT_VERSION, renderPlan } from './plan-report';
import { DEFAULT_HORIZON_HOURS, DEFAULT_WEIGHTS, readSchedulingSettings } from './scheduling-settings';

const HOUR = 60 * 60 * 1000;

interface Fixture {
  readonly scheduling?: unknown;
  readonly runs?: readonly object[];
}

/** Uma pasta temporaria com o `.taskin.json`, a camada da pessoa e o registro. */
function project(fixture: Fixture = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'taskin-plan-'));
  const paths = {
    repository: REPO,
    repositoryConfig: join(dir, '.taskin.json'),
    personalResources: join(dir, 'config', 'resources.json'),
  };
  const runsFile = join(dir, '.taskin', 'runs.jsonl');
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
  if (fixture.runs !== undefined) {
    mkdirSync(join(dir, '.taskin'), { recursive: true });
    writeFileSync(runsFile, fixture.runs.map((r) => `${JSON.stringify(r)}\n`).join(''));
  }
  return { dir, paths, runsFile };
}

async function plan(fixture: Fixture, tasks: readonly PlanTaskInput[]) {
  const { paths, runsFile } = project(fixture);
  const clock = new FakeClock();
  const ports = { ...createFakePluginPorts(), clock, secrets: createEnvSecretStore({ CONTA_A: 'a', CONTA_B: 'b' }) };
  const inventory = createLocalInventory(ports, paths);
  const resources = await localPlanResources({
    inventory,
    ledger: createLocalRunLedger({ clock }, runsFile),
    person: ANA,
    repository: REPO,
    view: await inventory.view(ANA, REPO),
    paths,
  });
  return buildPlanReport({ repository: 'repo-a', now: clock.now(), tasks, ...resources });
}

const task = (id: string, extra: Partial<PlanTaskInput> = {}): PlanTaskInput => ({
  id,
  title: `task ${id}`,
  requires: [],
  ...extra,
});

/** Uma execucao fechada no registro, uma hora antes do relogio falso. */
function run(access: string, tokens: number) {
  const finishedAt = new FakeClock().now() - HOUR;
  return {
    state: 'finished',
    id: `run-${access}`,
    repository: REPO,
    task: '1',
    estimated: 3,
    plannedAt: finishedAt - HOUR,
    access,
    startedAt: finishedAt - HOUR,
    found: 3,
    tokens,
    iterations: 1,
    completed: true,
    reworked: false,
    finishedAt,
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
    const report = await plan({ runs: [run('conta-a', 195_000)] }, [task('1')]);
    expect(report.history).toBe(true);
    const access = report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-a');
    expect(access?.remaining).toBe(5_000);
    const [assignment] = report.plan.assignments;
    expect(report.resources[assignment!.access]).toEqual({ name: 'conta-b', model: 'sonnet' });
    expect(renderPlan(report, 'text')).toContain('#1 task 1 → conta-b (sonnet) on servidor-1');
  });

  it('o historico da a taxa de conclusao e os tokens por dificuldade', async () => {
    const report = await plan({ runs: [run('conta-b', 30_000)] }, [task('1')]);
    const contaB = report.plan.problem.accesses.find((a) => report.resources[a.id]?.name === 'conta-b');
    expect(contaB?.completionRate).toBe(1);
    expect(report.plan.problem.tasks[0]?.estimatedTokens).toBe(30_000);
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
    const first = await plan({ runs: [run('conta-a', 10_000)] }, tasks);
    const second = await plan({ runs: [run('conta-a', 10_000)] }, tasks);
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
