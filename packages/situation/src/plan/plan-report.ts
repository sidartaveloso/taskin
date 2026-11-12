import { createMemoryScheduler, scorePlan, violations } from '../memory/scheduler.memory';
import type {
  Assignment,
  DeferredTask,
  ObjectiveWeights,
  Plan,
  SchedulingProblem,
  SuggestedPlan,
} from '../system/plugins/scheduler/scheduler.types';
import { instant, type TaskRef } from '../use-cases/branded';
import { buildSchedulingProblem, type PlanProblemInput } from './build-problem';

/** A versao do contrato JSON do `taskin plan`. Mudanca que quebra quem le sobe este numero. */
export const PLAN_REPORT_VERSION = 2;

const HOUR = 60 * 60 * 1000;

/**
 * O nome logico: so o que se pode mostrar. O modelo de cada atribuicao vem
 * nela (`Assignment.model`), e os que a conta oferece, no problema.
 */
export interface PlanResourceLabel {
  readonly name: string;
}

/**
 * O plano sugerido com a versao do contrato. E conselho: nada nele foi
 * executado. `deferred` traz as tasks que nenhuma combinacao viavel acomoda,
 * com o codigo da restricao, e as que a conta cheia empurra para depois do
 * horizonte (`concurrency`); `beyondHorizon`, as outras que so caberiam
 * depois dele.
 */
export interface PlanReport extends SuggestedPlan {
  readonly version: typeof PLAN_REPORT_VERSION;
  readonly repository: string;
  /** Se o registro tinha execucoes. Sem elas, o plano usa as estimativas declaradas. */
  readonly history: boolean;
  readonly horizonHours: number;
  readonly weights: ObjectiveWeights;
  readonly beyondHorizon: readonly TaskRef[];
  readonly titles: Readonly<Record<string, string>>;
  /** Acessos e maquinas pelo id, para quem le o plano nao precisar do inventario. */
  readonly resources: Readonly<Record<string, PlanResourceLabel>>;
}

export interface PlanReportInput extends PlanProblemInput {
  readonly repository: string;
}

/**
 * Sugere, para cada task aberta, conta, modelo, maquina e momento, pelo escalonador
 * do pacote. A mesma entrada da sempre o mesmo plano.
 */
export async function buildPlanReport(input: PlanReportInput): Promise<PlanReport> {
  const { problem, history } = buildSchedulingProblem(input);
  const { weights, horizonHours } = input.settings;
  const scheduler = createMemoryScheduler({ clock: { now: () => input.now } });
  const suggested = await scheduler.suggest(problem, weights);

  const limit = input.now + horizonHours * HOUR;
  const within = suggested.plan.assignments.filter((a) => a.at < limit);
  const plan: Plan = { problem, assignments: within };
  const beyond = suggested.plan.assignments.filter((a) => a.at >= limit).map((a) => a.task);
  const heldByAccount = beyond.filter((t) => heldByAccountCapacity(plan, t, limit));
  const beyondHorizon = beyond.filter((t) => !heldByAccount.includes(t));
  const deferred: DeferredTask[] = [
    ...suggested.deferred,
    ...heldByAccount.map((task): DeferredTask => ({ task, reason: 'concurrency' })),
  ];

  const resources: Record<string, PlanResourceLabel> = {};
  for (const a of input.accesses) resources[a.id] = { name: a.name };
  for (const m of input.machines) resources[m.id] = { name: m.name };

  return {
    version: PLAN_REPORT_VERSION,
    repository: input.repository,
    history,
    horizonHours,
    weights,
    plan,
    score: scorePlan(plan, weights),
    deferred,
    beyondHorizon,
    titles: Object.fromEntries(problem.tasks.map((t) => [t.task, titleOf(input, t.task)])),
    resources,
  };
}

/**
 * Se e a conta cheia que segura a task fora do horizonte: em algum momento
 * dentro dele, alguma combinacao cabe no plano sem a capacidade das contas, e
 * nenhuma cabe com ela.
 */
function heldByAccountCapacity(plan: Plan, task: TaskRef, limit: number): boolean {
  const { problem } = plan;
  const uncapped: SchedulingProblem = {
    ...problem,
    accesses: problem.accesses.map(({ concurrencyLimit: _, ...a }) => a),
  };
  const fits = (p: SchedulingProblem, assignment: Assignment) =>
    violations({ problem: p, assignments: [...plan.assignments, assignment] }).length === 0;
  let freed = false;
  for (let at: number = problem.now; at < limit; at += HOUR) {
    for (const access of problem.accesses) {
      for (const model of access.models) {
        for (const machine of problem.machines) {
          const assignment: Assignment = {
            task,
            access: access.id,
            model: model.name,
            machine: machine.id,
            at: instant(at),
          };
          if (fits(problem, assignment)) return false;
          if (fits(uncapped, assignment)) freed = true;
        }
      }
    }
  }
  return freed;
}

function titleOf(input: PlanReportInput, task: TaskRef): string {
  return input.tasks.find((t) => t.id === task || String(Number(t.id)) === task)?.title ?? '';
}

export type PlanFormat = 'text' | 'json';
export const PLAN_FORMATS: readonly PlanFormat[] = ['text', 'json'];

/** O plano em texto, por momento, ou o JSON versionado. */
export function renderPlan(report: PlanReport, format: PlanFormat): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;

  const name = (id: string) => report.resources[id]?.name ?? id;
  const task = (id: TaskRef) => `#${id} ${report.titles[id] ?? ''}`.trimEnd();
  const now = report.plan.problem.now;
  const lines: string[] = [`Plan for ${report.repository} (advice only: nothing runs)`];
  lines.push(
    report.history
      ? 'Using the run history in .taskin/runs.jsonl.'
      : 'No run history yet: using the declared estimates.',
  );

  if (report.plan.problem.accesses.length === 0) {
    lines.push('No LLM access is available here: declare one in the inventory (taskin status lists them).');
  }
  if (report.plan.problem.machines.length === 0) lines.push('No machine is available here.');

  const byMoment = new Map<number, typeof report.plan.assignments>();
  for (const a of report.plan.assignments) byMoment.set(a.at, [...(byMoment.get(a.at) ?? []), a]);
  for (const at of [...byMoment.keys()].sort((a, b) => a - b)) {
    const hours = Math.round((at - now) / HOUR);
    lines.push('', `${hours === 0 ? 'Now' : `In ${hours}h`} (${new Date(at).toISOString()}):`);
    for (const a of byMoment.get(at) ?? []) {
      lines.push(`  ${task(a.task)} → ${name(a.access)} (${a.model}) on ${name(a.machine)}`);
    }
  }
  if (report.plan.assignments.length === 0) lines.push('', 'Nothing fits right now.');

  if (report.deferred.length > 0) {
    lines.push('', 'Deferred:');
    for (const d of report.deferred) lines.push(`  ${task(d.task)} — ${d.reason}`);
  }
  if (report.beyondHorizon.length > 0) {
    lines.push('', `Beyond the ${report.horizonHours}h horizon:`);
    for (const t of report.beyondHorizon) lines.push(`  ${task(t)}`);
  }
  lines.push('', `Score: ${report.score.total.toFixed(2)}`);
  return `${lines.join('\n')}\n`;
}
