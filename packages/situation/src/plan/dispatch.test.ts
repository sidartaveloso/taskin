import { describe, expect, it } from 'vitest';
import { createMemoryScheduler } from '../memory/scheduler.memory';
import type { Assignment, Plan } from '../system/plugins/scheduler/scheduler.types';
import { accessKind, instant, type ResourceId, resourceId, type TaskRef, taskRef } from '../use-cases/branded';
import { FakeClock } from '../use-cases/fake-ports';
import { buildSchedulingProblem, type PlanAccessInput, type PlanTaskInput } from './build-problem';
import { type DispatchSlot, decideDispatch, dispatchPlan, runOutcomeFrom } from './dispatch';
import { schedulingSettings } from './scheduling-settings';

const HOUR = 60 * 60 * 1000;
const AQUI = resourceId('esta-maquina');
const LA = resourceId('outra-maquina');
const CONTA_A = resourceId('conta-a');
const CONTA_B = resourceId('conta-b');

const task = (id: string, extra: Partial<PlanTaskInput> = {}): PlanTaskInput => ({
  id,
  title: `task ${id}`,
  requires: [],
  ...extra,
});

const conta = (id: ResourceId, concurrencyLimit?: number): PlanAccessInput => ({
  id,
  name: String(id),
  accessKind: accessKind('llm'),
  clearance: 'internal',
  ...(concurrencyLimit === undefined ? {} : { concurrencyLimit }),
});

interface Mundo {
  readonly accesses: readonly PlanAccessInput[];
  /** A concorrencia desta maquina. */
  readonly concurrency: number;
  /** Uma segunda maquina, com o requisito `gpu`. */
  readonly remote?: boolean;
}

/** O plano do escalonador para as tasks abertas, sem as que `exclude` tira, no relogio. */
async function planejar(mundo: Mundo, clock: FakeClock, open: readonly PlanTaskInput[], exclude: readonly TaskRef[]) {
  const machines = [
    { id: AQUI, name: 'esta-maquina', capabilities: [] },
    ...(mundo.remote ? [{ id: LA, name: 'outra-maquina', capabilities: ['gpu'] }] : []),
  ];
  const { problem } = buildSchedulingProblem({
    now: clock.now(),
    tasks: open,
    accesses: mundo.accesses,
    machines,
    runs: [],
    spent: {},
    settings: schedulingSettings({
      machines: { 'esta-maquina': { concurrency: mundo.concurrency }, 'outra-maquina': { concurrency: 1 } },
    }),
    exclude: exclude.map(String),
  });
  const suggested = await createMemoryScheduler({ clock }).suggest(problem, schedulingSettings().weights);
  return suggested.plan;
}

/** Um lancador falso: cada lancamento fica rodando ate o teste o terminar. */
function lancador() {
  const rodando = new Map<string, () => void>();
  const lancadas: Assignment[][] = [];
  let rodada: Assignment[] = [];
  let avisar: (() => void) | undefined;
  return {
    lancadas,
    rodando: () => [...rodando.keys()],
    launch(assignment: Assignment): Promise<void> {
      rodada.push(assignment);
      return new Promise<void>((resolve) => {
        rodando.set(String(assignment.task), () => {
          rodando.delete(String(assignment.task));
          resolve();
        });
        avisar?.();
      });
    },
    /** Fecha a rodada de lancamentos e devolve o que ela lancou. */
    fecharRodada(): Assignment[] {
      lancadas.push(rodada);
      const r = rodada;
      rodada = [];
      return r;
    },
    terminar(task: string): void {
      rodando.get(task)?.();
    },
    /** Espera o laco assentar: lancar o que pode e ficar esperando. */
    async assentar(): Promise<void> {
      for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    },
  };
}

const at = (clock: FakeClock, hours = 0) => instant(clock.now() + hours * HOUR);
const atribuicao = (t: string, access: ResourceId, machine: ResourceId, when: number): Assignment => ({
  task: taskRef(t),
  access,
  model: 'opus',
  machine,
  at: instant(when),
});

describe('decideDispatch: o que sai agora, nesta maquina', () => {
  const clock = new FakeClock();
  const problema = (concurrency: number, limits: Partial<Record<string, number>> = {}, dependsOn: TaskRef[] = []) => ({
    now: clock.now(),
    tasks: ['1', '2', '3'].map((id) => ({
      task: taskRef(id),
      value: 1,
      estimated: 3 as never,
      sensitivity: 'public' as const,
      requirements: [],
      dependsOn: id === '3' ? dependsOn : [],
      estimatedTokens: 1 as never,
      interactive: false,
      interruptions: [],
    })),
    accesses: [CONTA_A, CONTA_B].map((id) => ({
      id,
      kind: accessKind('llm'),
      clearance: 'internal' as const,
      models: [{ name: 'opus', competence: 5 as never, completionRate: 1, costPerThousandTokens: 0 }],
      remaining: 1_000_000 as never,
      windowEndsAt: at(clock, 5),
      ...(limits[id] === undefined ? {} : { concurrencyLimit: limits[id] }),
    })),
    machines: [
      { id: AQUI, capabilities: [], concurrency },
      { id: LA, capabilities: [], concurrency: 1 },
    ],
    presence: [],
    quotaMargin: 0,
  });

  it('lanca so as atribuicoes desta maquina que ja podem comecar; as de outra maquina esperam o despacho remoto', () => {
    const plan: Plan = {
      problem: problema(3),
      assignments: [
        atribuicao('1', CONTA_A, AQUI, clock.now()),
        atribuicao('2', CONTA_B, LA, clock.now()),
        atribuicao('3', CONTA_B, AQUI, at(clock, 1)),
      ],
    };

    const d = decideDispatch(plan, { machine: AQUI, now: clock.now(), running: [] });

    expect(d.launch.map((a) => a.task)).toEqual(['1']);
    expect(d.remote.map((a) => a.task)).toEqual(['2']);
    expect(d.later.map((a) => a.task)).toEqual(['3']);
  });

  it('nunca passa da concurrency da maquina, contando o que ja roda nela', () => {
    const plan: Plan = {
      problem: problema(2),
      assignments: ['1', '2', '3'].map((t) => atribuicao(t, t === '1' ? CONTA_A : CONTA_B, AQUI, clock.now())),
    };
    const rodando: DispatchSlot[] = [{ task: taskRef('9'), access: CONTA_A, machine: AQUI }];

    const d = decideDispatch(plan, { machine: AQUI, now: clock.now(), running: rodando });

    expect(d.launch.map((a) => a.task)).toEqual(['1']);
    expect(d.later.map((a) => a.task)).toEqual(['2', '3']);
  });

  it('nunca passa da capacidade da conta, contando o que ja roda nela', () => {
    const plan: Plan = {
      problem: problema(5, { [CONTA_A]: 2 }),
      assignments: ['1', '2', '3'].map((t) => atribuicao(t, CONTA_A, AQUI, clock.now())),
    };
    const rodando: DispatchSlot[] = [{ task: taskRef('9'), access: CONTA_A, machine: LA }];

    const d = decideDispatch(plan, { machine: AQUI, now: clock.now(), running: rodando });

    expect(d.launch.map((a) => a.task)).toEqual(['1']);
  });

  it('uma task que ja roda nao sai de novo', () => {
    const plan: Plan = { problem: problema(3), assignments: [atribuicao('1', CONTA_A, AQUI, clock.now())] };

    const d = decideDispatch(plan, {
      machine: AQUI,
      now: clock.now(),
      running: [{ task: taskRef('1'), access: CONTA_A, machine: AQUI }],
    });

    expect(d.launch).toEqual([]);
  });

  it('uma task com dependencia aberta nao sai, mesmo atribuida para agora', () => {
    const plan: Plan = {
      problem: problema(3, {}, [taskRef('1')]),
      assignments: [atribuicao('3', CONTA_A, AQUI, clock.now())],
    };

    const d = decideDispatch(plan, { machine: AQUI, now: clock.now(), running: [] });

    expect(d.launch).toEqual([]);
    expect(d.later.map((a) => a.task)).toEqual(['3']);
  });
});

describe('dispatchPlan: o laco que lanca, espera e replaneja', () => {
  it('lanca em paralelo ate a concurrency da maquina e, quando uma termina, replaneja e lanca a proxima', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A), conta(CONTA_B)], concurrency: 2 };
    let abertas = [task('1', { order: 1 }), task('2', { order: 2 }), task('3', { order: 3 })];
    const planos: TaskRef[][] = [];
    const l = lancador();

    const fim = dispatchPlan({
      clock,
      machine: AQUI,
      plan: async (exclude) => {
        planos.push([...exclude]);
        return planejar(mundo, clock, abertas, exclude);
      },
      launch: (a) => l.launch(a),
    });

    await l.assentar();
    expect(l.fecharRodada().map((a) => a.task)).toEqual(['1', '2']);
    expect(l.rodando()).toEqual(['1', '2']);

    abertas = abertas.filter((t) => t.id !== '1');
    l.terminar('1');
    await l.assentar();
    expect(l.fecharRodada().map((a) => a.task)).toEqual(['3']);

    abertas = [];
    l.terminar('2');
    l.terminar('3');
    const resumo = await fim;

    expect(resumo.launched.map((a) => a.task)).toEqual(['1', '2', '3']);
    expect(planos.length).toBeGreaterThanOrEqual(2);
    expect(planos[1]).toEqual(expect.arrayContaining([taskRef('1'), taskRef('2')]));
  });

  it('nunca passa da capacidade da conta: com uma vaga em cada conta, duas tasks vao a contas diferentes', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A, 1), conta(CONTA_B, 1)], concurrency: 5 };
    const abertas = [task('1', { order: 1 }), task('2', { order: 2 }), task('3', { order: 3 })];
    const l = lancador();

    const fim = dispatchPlan({
      clock,
      machine: AQUI,
      plan: (exclude) => planejar(mundo, clock, abertas, exclude),
      launch: (a) => l.launch(a),
    });

    await l.assentar();
    const primeira = l.fecharRodada();
    expect(primeira.map((a) => a.task)).toEqual(['1', '2']);
    expect(new Set(primeira.map((a) => a.access))).toEqual(new Set([CONTA_A, CONTA_B]));

    l.terminar('1');
    await l.assentar();
    expect(l.fecharRodada().map((a) => a.task)).toEqual(['3']);
    l.terminar('2');
    l.terminar('3');
    await fim;
  });

  it('uma task com dependencia so sai depois que a dependencia fechou', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A), conta(CONTA_B)], concurrency: 3 };
    let abertas = [task('1', { order: 1 }), task('2', { order: 2, description: 'Depende da task-1.' })];
    const l = lancador();

    const fim = dispatchPlan({
      clock,
      machine: AQUI,
      plan: (exclude) => planejar(mundo, clock, abertas, exclude),
      launch: (a) => l.launch(a),
    });

    await l.assentar();
    expect(l.fecharRodada().map((a) => a.task)).toEqual(['1']);

    abertas = abertas.filter((t) => t.id !== '1');
    l.terminar('1');
    await l.assentar();
    expect(l.fecharRodada().map((a) => a.task)).toEqual(['2']);

    l.terminar('2');
    await fim;
  });

  it('uma task que terminou sem fechar nao sai de novo, e a que depende dela fica esperando', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A)], concurrency: 3 };
    const abertas = [task('1', { order: 1 }), task('2', { order: 2, description: 'Depende da task-1.' })];
    const l = lancador();

    const fim = dispatchPlan({
      clock,
      machine: AQUI,
      plan: (exclude) => planejar(mundo, clock, abertas, exclude),
      launch: (a) => l.launch(a),
    });

    await l.assentar();
    l.terminar('1');
    const resumo = await fim;

    expect(resumo.launched.map((a) => a.task)).toEqual(['1']);
  });

  it('as atribuicoes de outra maquina nao sao lancadas: voltam como esperando o despacho remoto', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A)], concurrency: 1, remote: true };
    const abertas = [task('1', { order: 1, requires: ['gpu'] })];
    const l = lancador();

    const resumo = await dispatchPlan({
      clock,
      machine: AQUI,
      plan: (exclude) => planejar(mundo, clock, abertas, exclude),
      launch: (a) => l.launch(a),
    });

    expect(resumo.launched).toEqual([]);
    expect(resumo.remote.map((a) => [a.task, a.machine])).toEqual([['1', LA]]);
  });

  it('interrompido, nao lanca mais nada e espera o que ja roda', async () => {
    const clock = new FakeClock();
    const mundo: Mundo = { accesses: [conta(CONTA_A), conta(CONTA_B)], concurrency: 1 };
    const abertas = [task('1', { order: 1 }), task('2', { order: 2 })];
    const parar = new AbortController();
    const l = lancador();

    const fim = dispatchPlan({
      clock,
      machine: AQUI,
      signal: parar.signal,
      plan: (exclude) => planejar(mundo, clock, abertas, exclude),
      launch: (a) => l.launch(a),
    });

    await l.assentar();
    parar.abort();
    l.terminar('1');
    const resumo = await fim;

    expect(resumo.launched.map((a) => a.task)).toEqual(['1']);
  });
});

describe('buildSchedulingProblem com exclude', () => {
  it('a task excluida nao e planejada, mas segura a que depende dela', () => {
    const { problem } = buildSchedulingProblem({
      now: new FakeClock().now(),
      tasks: [task('1'), task('2', { description: 'Depende da task-1.' }), task('3')],
      accesses: [conta(CONTA_A)],
      machines: [{ id: AQUI, name: 'esta-maquina', capabilities: [] }],
      runs: [],
      spent: {},
      settings: schedulingSettings(),
      exclude: ['1'],
    });

    expect(problem.tasks.map((t) => t.task)).toEqual(['2', '3']);
    expect(problem.tasks[0]?.dependsOn).toEqual(['1']);
  });
});

describe('runOutcomeFrom: o resultado que o comando escreveu', () => {
  it('le o que o comando disse e poe o modelo do plano', () => {
    const texto = JSON.stringify({ found: 4, tokens: 1234, iterations: 2, completed: true, reworked: false });
    expect(runOutcomeFrom(texto, 'opus')).toEqual({
      model: 'opus',
      found: 4,
      tokens: 1234,
      iterations: 2,
      completed: true,
      reworked: false,
    });
  });

  it('sem texto, com JSON quebrado ou incompleto, nao ha resultado', () => {
    expect(runOutcomeFrom(undefined, 'opus')).toBeUndefined();
    expect(runOutcomeFrom('{', 'opus')).toBeUndefined();
    expect(runOutcomeFrom(JSON.stringify({ found: 4, tokens: 1 }), 'opus')).toBeUndefined();
  });
});
