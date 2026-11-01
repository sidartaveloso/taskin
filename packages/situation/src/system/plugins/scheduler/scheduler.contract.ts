import { expect } from 'vitest';
import {
  accessKind,
  capability,
  difficulty,
  type Instant,
  instant,
  personId,
  resourceId,
  type TaskRef,
  taskRef,
  tokenCount,
} from '../../../use-cases/branded';
import { type CreatePlugin, describeCases, lifecycleCases, type PluginContractCase } from '../../plugin.contract';
import type {
  Assignment,
  ConstraintCode,
  IScheduler,
  ObjectiveWeights,
  Plan,
  SchedulerEvents,
  SchedulingAccess,
  SchedulingMachine,
  SchedulingProblem,
  SchedulingTask,
} from './scheduler.types';

const HOUR = 60 * 60 * 1000;
const NOW = instant(Date.UTC(2026, 9, 31, 9));
const LATER = instant(NOW + HOUR);
const ANDROID_SDK = capability('android-sdk');
const GPU = capability('gpu');
const CARLA = personId('carla');

const SUBSCRIPTION: SchedulingAccess = {
  id: resourceId('assinatura'),
  kind: accessKind('claude-code'),
  clearance: 'internal',
  competence: difficulty(5),
  completionRate: 0.9,
  costPerThousandTokens: 0,
  remaining: tokenCount(100_000),
  windowEndsAt: instant(NOW + 5 * HOUR),
};

const PAID_API: SchedulingAccess = {
  id: resourceId('api-paga'),
  kind: accessKind('openrouter'),
  clearance: 'public',
  competence: difficulty(3),
  completionRate: 0.8,
  costPerThousandTokens: 3,
  remaining: tokenCount(1_000_000),
  windowEndsAt: instant(NOW + 24 * HOUR),
};

const NOTEBOOK: SchedulingMachine = { id: resourceId('notebook'), capabilities: [], concurrency: 1 };
const DESKTOP: SchedulingMachine = { id: resourceId('desktop'), capabilities: [ANDROID_SDK, GPU], concurrency: 2 };

function task(name: string, overrides: Partial<SchedulingTask> = {}): SchedulingTask {
  return {
    task: taskRef(name),
    value: 10,
    estimated: difficulty(2),
    sensitivity: 'public',
    requirements: [],
    dependsOn: [],
    estimatedTokens: tokenCount(2_000),
    interactive: false,
    interruptions: [],
    ...overrides,
  };
}

const ANDROID_MOVABLE = { mobility: 'movable', capability: ANDROID_SDK, setupCost: 5 } as const;

function problem(tasks: readonly SchedulingTask[], overrides: Partial<SchedulingProblem> = {}): SchedulingProblem {
  return {
    now: NOW,
    tasks,
    accesses: [SUBSCRIPTION, PAID_API],
    machines: [NOTEBOOK, DESKTOP],
    presence: [{ from: NOW, to: LATER }],
    quotaMargin: 0.1,
    ...overrides,
  };
}

function assign(name: string, access: SchedulingAccess, machine: SchedulingMachine, at: Instant = NOW): Assignment {
  return { task: taskRef(name), access: access.id, machine: machine.id, at };
}

const plan = (p: SchedulingProblem, ...assignments: Assignment[]): Plan => ({ problem: p, assignments });

const WEIGHTS: ObjectiveWeights = { money: 1, setup: 0.5, rework: 1, interruptions: 2 };
const ZERO: ObjectiveWeights = { money: 0, setup: 0, rework: 0, interruptions: 0 };

const codes = (scheduler: IScheduler, p: Plan): ConstraintCode[] => scheduler.violations(p).map((v) => v.code);

function expectEveryTaskOnce(
  tasks: readonly SchedulingTask[],
  assigned: readonly TaskRef[],
  deferred: readonly TaskRef[],
) {
  expect([...assigned, ...deferred].sort()).toEqual(tasks.map((t) => t.task).sort());
}

export const SCHEDULER_CONTRACT_CASES: readonly PluginContractCase<IScheduler>[] = [
  ...lifecycleCases<SchedulerEvents, IScheduler>(async (scheduler) => {
    await scheduler.suggest(problem([task('task-1')]), WEIGHTS);
    return 'scheduler:plan-suggested';
  }, 'scheduler:plan-suggested'),

  // ─── A funcao objetivo ──────────────────────────────────────────────────
  {
    name: 'a nota soma valor e desconta dinheiro, preparo, retrabalho e interrupcoes pelos pesos',
    async run(scheduler) {
      const p = problem([task('task-1', { requirements: [ANDROID_MOVABLE], interruptions: [CARLA] })]);

      const score = scheduler.scorePlan(plan(p, assign('task-1', PAID_API, NOTEBOOK)), WEIGHTS);

      expect(score.terms.value).toBeCloseTo(8);
      expect(score.terms.money).toBeCloseTo(6);
      expect(score.terms.setup).toBeCloseTo(5);
      expect(score.terms.rework).toBeCloseTo(2);
      expect(score.terms.interruptions).toBe(1);
      expect(score.total).toBeCloseTo(8 - 6 - 0.5 * 5 - 2 - 2 * 1);
    },
  },
  {
    name: 'com os pesos zerados, a nota e o valor entregue',
    async run(scheduler) {
      const p = problem([task('task-1', { value: 7 })]);
      const score = scheduler.scorePlan(plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK)), ZERO);
      expect(score.total).toBeCloseTo(7 * 0.9);
    },
  },
  {
    name: 'a funcao objetivo e pura: o mesmo plano da sempre a mesma nota',
    async run(scheduler) {
      const p = plan(problem([task('task-1')]), assign('task-1', PAID_API, NOTEBOOK));
      expect(scheduler.scorePlan(p, WEIGHTS)).toEqual(scheduler.scorePlan(p, WEIGHTS));
    },
  },
  {
    name: 'o preparo do requisito movel e pago uma vez por maquina, por mais tasks que o usem',
    async run(scheduler) {
      const tasks = [
        task('task-1', { requirements: [ANDROID_MOVABLE] }),
        task('task-2', { requirements: [ANDROID_MOVABLE] }),
      ];
      const p = problem(tasks);

      const together = scheduler.scorePlan(
        plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK), assign('task-2', SUBSCRIPTION, NOTEBOOK, LATER)),
        WEIGHTS,
      );
      const onDesktop = scheduler.scorePlan(plan(p, assign('task-1', SUBSCRIPTION, DESKTOP)), WEIGHTS);

      expect(together.terms.setup).toBe(5);
      expect(onDesktop.terms.setup).toBe(0);
    },
  },
  {
    name: 'dois pedidos a mesma pessoa no mesmo momento contam uma interrupcao; em momentos diferentes, duas',
    async run(scheduler) {
      const tasks = [task('task-1', { interruptions: [CARLA] }), task('task-2', { interruptions: [CARLA] })];
      const p = problem(tasks);

      const grouped = plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP));
      const apart = plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP, LATER));

      expect(scheduler.scorePlan(grouped, WEIGHTS).terms.interruptions).toBe(1);
      expect(scheduler.scorePlan(apart, WEIGHTS).terms.interruptions).toBe(2);
    },
  },

  // ─── As restricoes ──────────────────────────────────────────────────────
  {
    name: 'um plano que respeita tudo nao fere restricao nenhuma',
    async run(scheduler) {
      const p = problem([task('task-1', { requirements: [ANDROID_MOVABLE] })]);
      expect(scheduler.violations(plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK)))).toEqual([]);
    },
  },
  {
    name: 'requisito fixo que a maquina nao tem fere a restricao; o movel so custa preparo',
    async run(scheduler) {
      const p = problem([task('task-1', { requirements: [{ mobility: 'fixed', capability: GPU }] })]);

      expect(codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK)))).toEqual(['fixed-requirement']);
      expect(codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, DESKTOP)))).toEqual([]);
    },
  },
  {
    name: 'o acesso precisa cobrir a dificuldade estimada',
    async run(scheduler) {
      const p = problem([task('task-1', { estimated: difficulty(4) })]);
      expect(codes(scheduler, plan(p, assign('task-1', PAID_API, NOTEBOOK)))).toEqual(['competence']);
    },
  },
  {
    name: 'a liberacao do acesso precisa cobrir a sensibilidade da task',
    async run(scheduler) {
      const p = problem([task('task-1', { sensitivity: 'internal' })]);
      expect(codes(scheduler, plan(p, assign('task-1', PAID_API, NOTEBOOK)))).toEqual(['data']);
      expect(codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK)))).toEqual([]);
    },
  },
  {
    name: 'os tokens estimados num acesso cabem no que resta, descontada a margem',
    async run(scheduler) {
      const p = problem([
        task('task-1', { estimatedTokens: tokenCount(60_000) }),
        task('task-2', { estimatedTokens: tokenCount(31_000) }),
      ]);

      const over = plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP));
      const violation = scheduler.violations(over);

      expect(violation.map((v) => v.code)).toEqual(['quota']);
      expect([...(violation[0]?.tasks ?? [])].sort()).toEqual(['task-1', 'task-2']);
    },
  },
  {
    name: 'uma dependencia precisa estar no plano e comecar antes',
    async run(scheduler) {
      const p = problem([task('task-1'), task('task-2', { dependsOn: [taskRef('task-1')] })]);

      const sameTime = plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP));
      const missing = plan(p, assign('task-2', SUBSCRIPTION, DESKTOP));
      const ordered = plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP, LATER));

      expect(codes(scheduler, sameTime)).toEqual(['dependency']);
      expect(codes(scheduler, missing)).toEqual(['dependency']);
      expect(codes(scheduler, ordered)).toEqual([]);
    },
  },
  {
    name: 'uma maquina nao roda ao mesmo tempo mais lotes do que comporta',
    async run(scheduler) {
      const p = problem([task('task-1'), task('task-2')]);

      expect(
        codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, NOTEBOOK), assign('task-2', SUBSCRIPTION, NOTEBOOK))),
      ).toEqual(['concurrency']);
      expect(
        codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-2', SUBSCRIPTION, DESKTOP))),
      ).toEqual([]);
    },
  },
  {
    name: 'task interativa so roda num momento com a pessoa presente',
    async run(scheduler) {
      const p = problem([task('task-1', { interactive: true })]);

      expect(codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, DESKTOP, LATER)))).toEqual(['presence']);
      expect(codes(scheduler, plan(p, assign('task-1', SUBSCRIPTION, DESKTOP, NOW)))).toEqual([]);
    },
  },
  {
    name: 'o plano que cita o que o problema nao tem, ou repete uma task, e recusado',
    async run(scheduler) {
      const p = problem([task('task-1')]);
      const ghost: Assignment = {
        task: taskRef('task-1'),
        access: resourceId('fantasma'),
        machine: NOTEBOOK.id,
        at: NOW,
      };

      expect(codes(scheduler, plan(p, ghost))).toEqual(['unknown-reference']);
      expect(
        codes(
          scheduler,
          plan(p, assign('task-1', SUBSCRIPTION, DESKTOP), assign('task-1', SUBSCRIPTION, DESKTOP, LATER)),
        ),
      ).toEqual(['unknown-reference']);
    },
  },

  // ─── O plano sugerido ───────────────────────────────────────────────────
  {
    name: 'o plano sugerido e viavel, e a nota dele e a da funcao objetivo',
    async run(scheduler) {
      const tasks = [
        task('task-1', { requirements: [ANDROID_MOVABLE] }),
        task('task-2', { sensitivity: 'internal' }),
        task('task-3', { dependsOn: [taskRef('task-1')] }),
        task('task-4', { interactive: true }),
      ];
      const p = problem(tasks);

      const suggested = await scheduler.suggest(p, WEIGHTS);

      expect(suggested.plan.problem).toEqual(p);
      expect(scheduler.violations(suggested.plan)).toEqual([]);
      expect(suggested.score).toEqual(scheduler.scorePlan(suggested.plan, WEIGHTS));
      expectEveryTaskOnce(
        tasks,
        suggested.plan.assignments.map((a) => a.task),
        suggested.deferred.map((d) => d.task),
      );
    },
  },
  {
    name: 'o que nao cabe fica adiado, com a restricao que impediu',
    async run(scheduler) {
      const p = problem([task('task-1', { sensitivity: 'sensitive' }), task('task-2')]);

      const suggested = await scheduler.suggest(p, WEIGHTS);

      expect(suggested.deferred).toEqual([{ task: 'task-1', reason: 'data' }]);
      expect(suggested.plan.assignments.map((a) => a.task)).toEqual(['task-2']);
    },
  },
  {
    name: 'com cota para uma so, vai a de maior prioridade',
    async run(scheduler) {
      const big = tokenCount(80_000);
      const p = problem(
        [task('task-1', { value: 3, estimatedTokens: big }), task('task-2', { value: 9, estimatedTokens: big })],
        { accesses: [SUBSCRIPTION] },
      );

      const suggested = await scheduler.suggest(p, WEIGHTS);

      expect(suggested.plan.assignments.map((a) => a.task)).toEqual(['task-2']);
      expect(suggested.deferred).toEqual([{ task: 'task-1', reason: 'quota' }]);
    },
  },
  {
    name: 'o requisito movel leva a task a maquina onde o preparo ja foi pago',
    async run(scheduler) {
      const p = problem([task('task-1', { requirements: [ANDROID_MOVABLE] })]);

      const suggested = await scheduler.suggest(p, WEIGHTS);

      expect(suggested.plan.assignments.map((a) => a.machine)).toEqual([DESKTOP.id]);
    },
  },
  {
    name: 'o dinheiro pesa: sem diferenca de resto, vai pelo acesso que nao custa',
    async run(scheduler) {
      const p = problem([task('task-1')], {
        accesses: [PAID_API, { ...SUBSCRIPTION, completionRate: PAID_API.completionRate }],
      });

      const suggested = await scheduler.suggest(p, WEIGHTS);

      expect(suggested.plan.assignments.map((a) => a.access)).toEqual([SUBSCRIPTION.id]);
    },
  },
];

export function describeSchedulerContract(label: string, create: CreatePlugin<IScheduler>): void {
  describeCases(label, create, SCHEDULER_CONTRACT_CASES);
}
