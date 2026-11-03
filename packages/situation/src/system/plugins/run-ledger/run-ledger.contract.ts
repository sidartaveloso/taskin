import { expect } from 'vitest';
import {
  difficulty,
  expertise,
  instant,
  personId,
  repositoryId,
  resourceId,
  taskRef,
  tokenCount,
  viewpointId,
} from '../../../use-cases/branded';
import type { RunOutcome, RunStarted, ViewpointDelivered } from '../../../use-cases/flows.types';
import { REPO } from '../../../use-cases/scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { IRunLedger, RunLedgerEvents } from './run-ledger.types';

const CONTA_A = resourceId('conta-a');
const CONTA_B = resourceId('conta-b');
const MINUTE = 60 * 1000;

const outcome = (tokens: number, overrides: Partial<RunOutcome> = {}): RunOutcome => ({
  found: difficulty(3),
  tokens: tokenCount(tokens),
  iterations: 1,
  completed: true,
  reworked: false,
  ...overrides,
});

async function started(ledger: IRunLedger, task: string, access = CONTA_A, repository = REPO): Promise<RunStarted> {
  return ledger.startRun(await ledger.planRun(repository, taskRef(task), difficulty(2)), access);
}

function delivered(run: RunStarted, answer: string): ViewpointDelivered {
  return {
    state: 'delivered',
    id: viewpointId(`vp-${run.id}`),
    repository: run.repository,
    task: run.task,
    run: run.id,
    expertise: expertise('design'),
    question: 'O espacamento esta bom?',
    reviewer: personId('carla'),
    answer,
    deliveredAt: instant(run.startedAt),
  };
}

export const RUN_LEDGER_CONTRACT_CASES: readonly PluginContractCase<IRunLedger>[] = [
  ...lifecycleCases<RunLedgerEvents, IRunLedger>(async (ledger) => {
    await ledger.planRun(REPO, taskRef('task-1'), difficulty(2));
    return 'run-ledger:run-planned';
  }, 'run-ledger:run-planned'),
  {
    name: 'a execucao guarda a dificuldade estimada e a encontrada, o consumo e a duracao pelo relogio',
    async run(ledger, ports) {
      const planned = await ledger.planRun(REPO, taskRef('task-7'), difficulty(2));
      expect(planned).toMatchObject({ state: 'planned', task: 'task-7', estimated: 2, plannedAt: ports.clock.now() });

      const run = await ledger.startRun(planned, CONTA_A);
      expect(run).toMatchObject({ state: 'started', id: planned.id, access: CONTA_A, startedAt: ports.clock.now() });

      ports.clock.advance(25 * MINUTE);
      const finished = await ledger.finishRun(run, outcome(180_000, { found: difficulty(4), iterations: 3 }));

      expect(finished).toMatchObject({
        state: 'finished',
        id: planned.id,
        estimated: 2,
        found: 4,
        tokens: 180_000,
        iterations: 3,
        duration: 25 * MINUTE,
        finishedAt: ports.clock.now(),
        access: CONTA_A,
      });
    },
  },
  {
    name: 'o registro lista so as execucoes fechadas do repositorio, na ordem em que fecharam',
    async run(ledger) {
      const first = await started(ledger, 'task-1');
      const second = await started(ledger, 'task-2');
      await started(ledger, 'task-3');
      await started(ledger, 'task-4', CONTA_A, repositoryId('outro-repo')).then((r) => ledger.finishRun(r, outcome(1)));

      const b = await ledger.finishRun(second, outcome(10));
      const a = await ledger.finishRun(first, outcome(20));

      expect(await ledger.runs(REPO)).toEqual([b, a]);
    },
  },
  {
    name: 'as execucoes em aberto sao as que comecaram e nao terminaram, de qualquer repositorio, na ordem em que comecaram',
    async run(ledger) {
      const first = await started(ledger, 'task-1');
      const second = await started(ledger, 'task-2', CONTA_B, repositoryId('outro-repo'));
      const third = await started(ledger, 'task-3');
      await ledger.planRun(REPO, taskRef('task-4'), difficulty(2));

      expect(await ledger.openRuns()).toEqual([first, second, third]);

      await ledger.finishRun(second, outcome(10));
      expect(await ledger.openRuns()).toEqual([first, third]);
    },
  },
  {
    name: 'cada execucao tem id proprio',
    async run(ledger) {
      const a = await ledger.planRun(REPO, taskRef('task-1'), difficulty(2));
      const b = await ledger.planRun(REPO, taskRef('task-1'), difficulty(2));
      expect(a.id).not.toBe(b.id);
    },
  },
  {
    name: 'o consumo de um acesso soma os tokens das execucoes fechadas nele desde o instante pedido',
    async run(ledger, ports) {
      await ledger.finishRun(await started(ledger, 'task-1'), outcome(100));
      const since = instant(ports.clock.now() + MINUTE);
      ports.clock.advance(2 * MINUTE);
      await ledger.finishRun(await started(ledger, 'task-2'), outcome(250));
      await ledger.finishRun(await started(ledger, 'task-3'), outcome(40));
      await ledger.finishRun(await started(ledger, 'task-4', CONTA_B), outcome(999));

      expect(await ledger.consumption(CONTA_A, since)).toBe(290);
    },
  },
  {
    name: 'o ponto de vista entregue fica registrado na execucao da task, e so nela',
    async run(ledger) {
      const run = await started(ledger, 'task-9');
      const other = await started(ledger, 'task-8');
      const viewpoint = delivered(run, 'Aumentar para 24px.');

      await ledger.recordViewpoint(viewpoint);

      expect(await ledger.viewpoints(REPO, taskRef('task-9'))).toEqual([viewpoint]);
      expect(await ledger.viewpoints(REPO, other.task)).toEqual([]);
    },
  },
  {
    name: 'planejar, comecar, fechar e registrar um ponto de vista viram eventos, em ordem',
    async run(ledger) {
      await ledger.start();
      const seen = recordEvents(ledger, [
        'run-ledger:run-planned',
        'run-ledger:run-started',
        'run-ledger:run-finished',
        'run-ledger:viewpoint-recorded',
      ]);

      const run = await started(ledger, 'task-1');
      await ledger.recordViewpoint(delivered(run, 'Ok.'));
      const finished = await ledger.finishRun(run, outcome(10));

      expect(seen.map((e) => e.type)).toEqual([
        'run-ledger:run-planned',
        'run-ledger:run-started',
        'run-ledger:viewpoint-recorded',
        'run-ledger:run-finished',
      ]);
      const { state: _, ...fact } = finished;
      expect(seen[3]?.payload).toEqual(fact);
    },
  },
];

export function describeRunLedgerContract(label: string, create: CreatePlugin<IRunLedger>): void {
  describeCases(label, create, RUN_LEDGER_CONTRACT_CASES);
}
