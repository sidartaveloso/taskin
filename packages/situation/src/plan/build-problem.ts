import type {
  SchedulingAccess,
  SchedulingMachine,
  SchedulingProblem,
  SchedulingRequirement,
  SchedulingTask,
} from '../system/plugins/scheduler/scheduler.types';
import {
  type AccessKind,
  capability,
  type DataClass,
  type Difficulty,
  difficulty,
  type Instant,
  instant,
  type ResourceId,
  type TaskRef,
  taskRef,
  tokenCount,
} from '../use-cases/branded';
import type { RunRecord } from '../use-cases/flows.types';
import { DEFAULT_ACCESS_SETTINGS, type SchedulingSettings } from './scheduling-settings';

const HOUR = 60 * 60 * 1000;

/** A dificuldade de uma task que nao declara nenhuma. */
export const DEFAULT_TASK_DIFFICULTY = 3;

/** Uma task aberta como o provider a entrega: o corpo vem em `description`. */
export interface PlanTaskInput {
  readonly id: string;
  readonly title: string;
  /** A posicao na fila manual: menor vem antes. Sem ela, a task fica atras das numeradas. */
  readonly order?: number;
  readonly difficulty?: number;
  readonly requires: readonly string[];
  /** O corpo da task, onde as notas dizem "Depende da task-N". */
  readonly description?: string;
}

export interface PlanAccessInput {
  readonly id: ResourceId;
  readonly name: string;
  readonly accessKind: AccessKind;
  readonly clearance: DataClass;
}

export interface PlanMachineInput {
  readonly id: ResourceId;
  readonly name: string;
  readonly capabilities: readonly string[];
}

export interface PlanProblemInput {
  readonly now: Instant;
  readonly tasks: readonly PlanTaskInput[];
  readonly accesses: readonly PlanAccessInput[];
  readonly machines: readonly PlanMachineInput[];
  /** O historico do time: as execucoes fechadas, so com o que calibra (modelo, tokens, conclusao). */
  readonly runs: readonly RunRecord[];
  /** O que cada acesso gastou na janela dele, pelo id, contado no estado desta maquina. */
  readonly spent: Readonly<Record<string, number>>;
  readonly settings: SchedulingSettings;
}

export interface BuiltProblem {
  readonly problem: SchedulingProblem;
  /** Se o registro tinha alguma execucao; sem ela, so as estimativas declaradas. */
  readonly history: boolean;
}

const DEPENDS_ON = /Depende da task-(\d+)/gi;

/** As tasks que as notas citam com "Depende da task-N". */
export function dependenciesOf(description: string | undefined): string[] {
  if (description === undefined) return [];
  return [...new Set([...description.matchAll(DEPENDS_ON)].map((m) => String(Number(m[1]))))];
}

/** A fila manual: pela `order`, as sem numero atras, e o id desempata. */
function byQueue(a: PlanTaskInput, b: PlanTaskInput): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao < bo ? -1 : 1;
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

/**
 * O modelo de um acesso para o historico: o que `resources.scheduling` declara
 * e, sem ele, o tipo do acesso. O historico do time e por modelo, nao por conta.
 */
export function modelOf(access: PlanAccessInput, settings: SchedulingSettings): string {
  return settings.accesses[access.name]?.model ?? String(access.accessKind);
}

/** A janela, em milissegundos, em que o consumo de um acesso conta para a cota. */
export function windowMsOf(access: PlanAccessInput, settings: SchedulingSettings): number {
  return (settings.accesses[access.name]?.windowHours ?? DEFAULT_ACCESS_SETTINGS.windowHours) * HOUR;
}

/**
 * Monta o problema do escalonador com o que existe: as tasks abertas (a
 * posicao na fila vira valor, a primeira vale tantas quantas ha), o inventario
 * e o registro. O historico do time da a taxa de conclusao de cada modelo e os
 * tokens por dificuldade; o consumo da janela vem do estado desta maquina; sem ele, valem os numeros declarados
 * em `resources.scheduling`.
 */
export function buildSchedulingProblem(input: PlanProblemInput): BuiltProblem {
  const { now, settings, runs } = input;
  const queue = [...input.tasks].sort(byQueue);
  const open = new Set(queue.map((t) => normalizeId(t.id)));

  const tokensFor = (d: Difficulty): number => {
    const seen = runs.filter((r) => r.estimated === d);
    if (seen.length === 0) return settings.tokensByDifficulty[Number(d) as 1 | 2 | 3 | 4 | 5];
    return Math.round(seen.reduce((sum, r) => sum + r.tokens, 0) / seen.length);
  };

  const tasks: SchedulingTask[] = queue.map((t, index) => {
    const estimated = difficulty(t.difficulty ?? DEFAULT_TASK_DIFFICULTY);
    const requirements: SchedulingRequirement[] = t.requires
      .filter((r) => !r.startsWith('review:'))
      .map((r) => {
        const setupCost = settings.movable[r];
        return setupCost === undefined
          ? { mobility: 'fixed', capability: capability(r) }
          : { mobility: 'movable', capability: capability(r), setupCost };
      });
    const id = normalizeId(t.id);
    return {
      task: taskRef(id),
      value: queue.length - index,
      estimated,
      sensitivity: 'public',
      requirements,
      dependsOn: dependenciesOf(t.description)
        .filter((d) => d !== id && open.has(d))
        .map((d): TaskRef => taskRef(d)),
      estimatedTokens: tokenCount(tokensFor(estimated)),
      interactive: false,
      interruptions: [],
    };
  });

  const accesses: SchedulingAccess[] = input.accesses.map((a) => {
    const declared = { ...DEFAULT_ACCESS_SETTINGS, ...settings.accesses[a.name] };
    const mine = runs.filter((r) => r.model === modelOf(a, settings));
    const windowMs = windowMsOf(a, settings);
    const spent = input.spent[a.id] ?? 0;
    return {
      id: a.id,
      kind: a.accessKind,
      clearance: a.clearance,
      competence: difficulty(declared.competence),
      completionRate:
        mine.length === 0 ? declared.completionRate : mine.filter((r) => r.completed).length / mine.length,
      costPerThousandTokens: declared.costPerThousandTokens,
      remaining: tokenCount(
        declared.quota === undefined ? Number.MAX_SAFE_INTEGER : Math.max(0, declared.quota - spent),
      ),
      windowEndsAt: instant(now + Math.round(windowMs)),
    };
  });

  const machines: SchedulingMachine[] = input.machines.map((m) => ({
    id: m.id,
    capabilities: m.capabilities.map(capability),
    concurrency: settings.machines[m.name]?.concurrency ?? 1,
  }));

  return {
    problem: { now, tasks, accesses, machines, presence: [], quotaMargin: settings.quotaMargin },
    history: runs.length > 0,
  };
}

/** `"007"` e `"7"` sao a mesma task. */
function normalizeId(id: string): string {
  return /^\d+$/.test(id) ? String(Number(id)) : id;
}
