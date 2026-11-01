import { describe, expect, it } from 'vitest';
import { createMemoryScheduler } from '../memory/scheduler.memory';
import type { SchedulingProblem, SchedulingTask } from '../system/plugins/scheduler/scheduler.types';
import { accessKind, difficulty, resourceId, taskRef, tokenCount } from '../use-cases/branded';
import { FakeClock } from '../use-cases/fake-ports';
import { SimulatedProvider, schedulingAccessFrom } from './provider.simulated';

const HOUR = 60 * 60 * 1000;
const CONTA = resourceId('conta-simulada');
const WEIGHTS = { money: 1, setup: 1, rework: 1, interruptions: 1 };

function task(name: string, tokens: number): SchedulingTask {
  return {
    task: taskRef(name),
    value: 10,
    estimated: difficulty(2),
    sensitivity: 'public',
    requirements: [],
    dependsOn: [],
    estimatedTokens: tokenCount(tokens),
    interactive: false,
    interruptions: [],
  };
}

function setup() {
  const clock = new FakeClock();
  const provider = new SimulatedProvider(clock, [{ id: CONTA, limit: tokenCount(10_000), windowMs: 5 * HOUR }]);
  const problem = async (tasks: readonly SchedulingTask[]): Promise<SchedulingProblem> => ({
    now: clock.now(),
    tasks,
    accesses: [
      await schedulingAccessFrom(provider, {
        id: CONTA,
        kind: accessKind('claude-code'),
        clearance: 'public',
        competence: difficulty(5),
        completionRate: 0.9,
        costPerThousandTokens: 0,
      }),
    ],
    machines: [{ id: resourceId('notebook'), capabilities: [], concurrency: 2 }],
    presence: [],
    quotaMargin: 0.1,
  });
  return { clock, provider, problem };
}

describe('o provedor simulado', () => {
  it('conta o gasto na janela e recusa o que passa do limite', async () => {
    const { clock, provider } = setup();

    expect(provider.consume(CONTA, 6_000)).toBe(true);
    expect(provider.consume(CONTA, 5_000)).toBe(false);
    expect(await provider.usage(CONTA)).toEqual({
      used: 6_000,
      limit: 10_000,
      windowEndsAt: clock.now() + 5 * HOUR,
      observedAt: clock.now(),
    });
  });

  it('a janela recomeca sozinha, zerando o gasto', async () => {
    const { clock, provider } = setup();
    const start = clock.now();
    provider.consume(CONTA, 9_000);

    clock.advance(5 * HOUR);

    expect(await provider.usage(CONTA)).toMatchObject({ used: 0, windowEndsAt: start + 10 * HOUR });
  });

  it('o escalonador adia pela cota o que nao cabe na janela gasta, e atribui quando ela recomeca', async () => {
    const { clock, provider, problem } = setup();
    const scheduler = createMemoryScheduler({ clock });
    provider.consume(CONTA, 6_000);
    const tasks = [task('task-1', 3_000), task('task-2', 3_000)];

    const spent = await scheduler.suggest(await problem(tasks), WEIGHTS);
    expect(spent.plan.assignments.map((a) => a.task)).toEqual(['task-1']);
    expect(spent.deferred).toEqual([{ task: 'task-2', reason: 'quota' }]);

    clock.advance(5 * HOUR);
    const fresh = await scheduler.suggest(await problem(tasks), WEIGHTS);
    expect(fresh.plan.assignments.map((a) => a.task).sort()).toEqual(['task-1', 'task-2']);
    expect(fresh.deferred).toEqual([]);
  });
});
