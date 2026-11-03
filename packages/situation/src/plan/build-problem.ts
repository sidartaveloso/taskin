import type {
  SchedulingAccess,
  SchedulingMachine,
  SchedulingModel,
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
import {
  type AccessSettings,
  DEFAULT_ACCESS_SETTINGS,
  type ModelSettings,
  type SchedulingSettings,
} from './scheduling-settings';

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
  /** Quantas execucoes a conta aceita ao mesmo tempo, pelo inventario. Sem ele, nao ha teto. */
  readonly concurrencyLimit?: number;
  /**
   * Os ajustes deste acesso, ja resolvidos pela camada dele: os do arquivo da
   * pessoa para uma conta pessoal. Sem eles, vale `resources.scheduling.accesses` pelo nome.
   */
  readonly settings?: AccessSettings;
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
  /**
   * As tasks abertas que o plano nao atribui: as que ja rodam, ou que o
   * despacho ja tentou. Continuam abertas para quem depende delas.
   */
  readonly exclude?: readonly string[];
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
 * Os modelos que uma conta oferece, com o que cada um declara e, no que nao
 * declara, o da conta e o padrao. `model` vale como a lista de um modelo so;
 * sem nenhum dos dois, o modelo e o tipo do acesso. O historico do time e por
 * modelo, nao por conta.
 */
export function modelsOf(access: PlanAccessInput, settings: SchedulingSettings): Required<ModelSettings>[] {
  const own = accessSettingsOf(access, settings);
  const declared = { ...DEFAULT_ACCESS_SETTINGS, ...own };
  const list: readonly ModelSettings[] = own?.models ?? [{ name: own?.model ?? String(access.accessKind) }];
  return list.map((m) => ({
    name: m.name,
    competence: m.competence ?? declared.competence,
    completionRate: m.completionRate ?? declared.completionRate,
    costPerThousandTokens: m.costPerThousandTokens ?? declared.costPerThousandTokens,
  }));
}

/** Os ajustes de um acesso: os que a camada dele declarou, ou os de `resources.scheduling.accesses`. */
export function accessSettingsOf(access: PlanAccessInput, settings: SchedulingSettings): AccessSettings | undefined {
  return access.settings ?? settings.accesses[access.name];
}

/** A janela, em milissegundos, em que o consumo de um acesso conta para a cota. */
export function windowMsOf(access: PlanAccessInput, settings: SchedulingSettings): number {
  return (accessSettingsOf(access, settings)?.windowHours ?? DEFAULT_ACCESS_SETTINGS.windowHours) * HOUR;
}

/**
 * Monta o problema do escalonador com o que existe: as tasks abertas (a
 * posicao na fila vira valor, a primeira vale tantas quantas ha), o inventario
 * e o registro. O historico do time da a taxa de conclusao de cada modelo e os
 * tokens por dificuldade; cada conta traz os modelos que oferece, que dividem a cota dela; o consumo da janela vem do estado desta maquina; sem ele, valem os numeros declarados
 * em `resources.scheduling`.
 */
export function buildSchedulingProblem(input: PlanProblemInput): BuiltProblem {
  const { now, settings, runs } = input;
  const excluded = new Set((input.exclude ?? []).map(normalizeId));
  const open = new Set(input.tasks.map((t) => normalizeId(t.id)));
  const queue = input.tasks.filter((t) => !excluded.has(normalizeId(t.id))).sort(byQueue);

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
    const quota = accessSettingsOf(a, settings)?.quota;
    const windowMs = windowMsOf(a, settings);
    const spent = input.spent[a.id] ?? 0;
    const models: SchedulingModel[] = modelsOf(a, settings).map((m) => {
      const mine = runs.filter((r) => r.model === m.name);
      return {
        name: m.name,
        competence: difficulty(m.competence),
        completionRate: mine.length === 0 ? m.completionRate : mine.filter((r) => r.completed).length / mine.length,
        costPerThousandTokens: m.costPerThousandTokens,
      };
    });
    return {
      id: a.id,
      kind: a.accessKind,
      clearance: a.clearance,
      models,
      remaining: tokenCount(quota === undefined ? Number.MAX_SAFE_INTEGER : Math.max(0, quota - spent)),
      windowEndsAt: instant(now + Math.round(windowMs)),
      ...(a.concurrencyLimit === undefined ? {} : { concurrencyLimit: a.concurrencyLimit }),
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
