import {
  buildPlanReport,
  createLocalRunLedger,
  type IRunLedger,
  instant,
  localPlanResources,
  type PlanReport,
  type PlanTaskInput,
} from '@opentask/taskin-situation';
import type { Task } from '@opentask/taskin-types';
import path from 'path';
import { type ProbedSituation, probeLocalSituation } from './probe-situation.js';
import { resolveTaskProvider } from './provider-factory/index.js';
import { runLedgerFiles } from './run-ledger-files.js';

const OPEN = new Set(['pending', 'in-progress', 'paused', 'in-review', 'blocked']);

export interface LocalPlanner {
  readonly situation: ProbedSituation;
  readonly ledger: IRunLedger;
  /**
   * O plano de agora, com as tasks abertas lidas de novo do provider e o
   * consumo de novo do estado da maquina. As de `exclude` nao sao atribuidas,
   * mas seguram quem depende delas.
   */
  plan(exclude?: readonly string[]): Promise<PlanReport>;
}

/**
 * O que o `taskin plan` e o `taskin run` leem para planejar: esta maquina
 * sondada uma vez, o registro de execucoes e as tasks abertas. Os avisos vao
 * para `warn`, uma vez.
 */
export async function openLocalPlanner(root: string, warn: (message: string) => void): Promise<LocalPlanner> {
  const situation = await probeLocalSituation(root);
  const clock = { now: () => instant(Date.now()) };
  const ledger = createLocalRunLedger({ clock }, runLedgerFiles(root));
  const { provider } = await resolveTaskProvider();
  let warned = false;

  return {
    situation,
    ledger,
    async plan(exclude = []) {
      const resources = await localPlanResources({ ...situation, ledger, clock });
      if (!warned) for (const warning of resources.warnings) warn(warning);
      warned = true;

      const tasks: Task[] = await provider.getAllTasks();
      const open: PlanTaskInput[] = tasks
        .filter((t) => OPEN.has(t.status))
        .map((t) => ({
          id: String(t.id),
          title: t.title,
          ...(t.order !== undefined && { order: t.order }),
          ...(t.difficulty !== undefined && { difficulty: t.difficulty }),
          requires: t.requires ?? [],
          ...(t.description !== undefined && { description: t.description }),
        }));

      return buildPlanReport({
        repository: path.basename(root),
        now: clock.now(),
        tasks: open,
        exclude,
        ...resources,
      });
    },
  };
}
