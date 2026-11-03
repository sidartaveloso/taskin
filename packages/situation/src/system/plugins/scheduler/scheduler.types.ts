import type {
  AccessKind,
  Capability,
  DataClass,
  Difficulty,
  Instant,
  PersonId,
  ResourceId,
  TaskRef,
  TokenCount,
} from '../../../use-cases/branded';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O escalonador: atribui a cada task uma conta de LLM, um modelo dela, uma maquina e um
 * momento, ou a deixa para depois, maximizando uma funcao objetivo pura sob
 * restricoes. Conselho antes de despacho: ele sugere, nao executa.
 */
export interface IScheduler extends IPluginSituation<SchedulerEvents> {
  readonly key: PluginKey<'scheduler'>;
  /** A funcao objetivo: pura, so le o plano e os pesos. */
  scorePlan(plan: Plan, weights: ObjectiveWeights): PlanScore;
  /** As restricoes que o plano fere. Vazio quando o plano e viavel. */
  violations(plan: Plan): readonly ConstraintViolation[];
  /**
   * Um plano viavel e bom para o problema: guloso por prioridade, respeitando as
   * restricoes. O que nao cabe fica adiado, com o motivo.
   */
  suggest(problem: SchedulingProblem, weights: ObjectiveWeights): Promise<SuggestedPlan>;
}

/* ─── O problema ─────────────────────────────────────────────────────────── */

/**
 * Um requisito fixo (hardware, presenca, conta especifica) e restricao. Um
 * movel (software, dados, imagem, SDK, clone) e custo de preparo, pago uma vez
 * por maquina.
 */
export type SchedulingRequirement =
  | { readonly mobility: 'fixed'; readonly capability: Capability }
  | { readonly mobility: 'movable'; readonly capability: Capability; readonly setupCost: number };

export interface SchedulingTask {
  readonly task: TaskRef;
  /** O valor de concluir a task, pela prioridade. */
  readonly value: number;
  readonly estimated: Difficulty;
  readonly sensitivity: DataClass;
  readonly requirements: readonly SchedulingRequirement[];
  /** Tasks que precisam ter comecado antes, num momento anterior. */
  readonly dependsOn: readonly TaskRef[];
  readonly estimatedTokens: TokenCount;
  /** Uma task `interactive` so roda com a pessoa presente. */
  readonly interactive: boolean;
  /** Os pedidos de ponto de vista que a task fara, por pessoa: as interrupcoes. */
  readonly interruptions: readonly PersonId[];
}

/** Um modelo que uma conta oferece. Os modelos de uma conta dividem a cota e a janela dela. */
export interface SchedulingModel {
  readonly name: string;
  /** A maior dificuldade que o modelo cobre. */
  readonly competence: Difficulty;
  /** A fracao das execucoes que concluem, pelo registro do modelo: de 0 a 1. */
  readonly completionRate: number;
  /** Dinheiro por mil tokens. Zero na assinatura e no modelo local. */
  readonly costPerThousandTokens: number;
}

/** Uma conta: a liberacao, os modelos que ela oferece, e a cota que eles dividem. */
export interface SchedulingAccess {
  readonly id: ResourceId;
  readonly kind: AccessKind;
  readonly clearance: DataClass;
  /** Os modelos da conta, ao menos um. */
  readonly models: readonly SchedulingModel[];
  /** O que resta na janela atual, para todos os modelos da conta juntos. */
  readonly remaining: TokenCount;
  readonly windowEndsAt: Instant;
}

export interface SchedulingMachine {
  readonly id: ResourceId;
  readonly capabilities: readonly Capability[];
  /** Quantos lotes cabem na memoria ao mesmo tempo. */
  readonly concurrency: number;
}

/** Quando a pessoa esta presente: `[from, to)`. */
export interface PresenceWindow {
  readonly from: Instant;
  readonly to: Instant;
}

export interface SchedulingProblem {
  readonly now: Instant;
  readonly tasks: readonly SchedulingTask[];
  readonly accesses: readonly SchedulingAccess[];
  readonly machines: readonly SchedulingMachine[];
  readonly presence: readonly PresenceWindow[];
  /** A fracao da cota que nao se planeja gastar: `0.1` deixa 10% de folga. */
  readonly quotaMargin: number;
}

/* ─── O plano ────────────────────────────────────────────────────────────── */

export interface Assignment {
  readonly task: TaskRef;
  readonly access: ResourceId;
  /** O modelo da conta que roda a task: um dos `models` do acesso. */
  readonly model: string;
  readonly machine: ResourceId;
  readonly at: Instant;
}

export interface Plan {
  readonly problem: SchedulingProblem;
  readonly assignments: readonly Assignment[];
}

/** Os pesos λ da funcao objetivo, todos maiores ou iguais a zero. */
export interface ObjectiveWeights {
  /** λ₁: dinheiro. */
  readonly money: number;
  /** λ₂: preparo, levar a maquina o requisito movel que falta. */
  readonly setup: number;
  /** λ₃: risco de retrabalho. */
  readonly rework: number;
  /** λ₄: interrupcoes de pessoas. */
  readonly interruptions: number;
}

/**
 * Os termos, cada um somado sobre as atribuicoes:
 *
 * - `value`: `task.value × model.completionRate`, o modelo da atribuicao;
 * - `money`: `task.estimatedTokens / 1000 × model.costPerThousandTokens`;
 * - `setup`: o `setupCost` de cada requisito movel que a maquina nao tem,
 *   contado uma vez por par maquina e requisito, por mais tasks que o usem;
 * - `rework`: `task.value × (1 − model.completionRate)`;
 * - `interruptions`: as pessoas distintas interrompidas no mesmo momento,
 *   somadas por momento: dois pedidos a mesma pessoa juntos contam um.
 *
 * `total = value − λ₁·money − λ₂·setup − λ₃·rework − λ₄·interruptions`.
 */
export interface PlanScore {
  readonly total: number;
  readonly terms: {
    readonly value: number;
    readonly money: number;
    readonly setup: number;
    readonly rework: number;
    readonly interruptions: number;
  };
}

export const CONSTRAINT_CODES = [
  /** Os tokens estimados numa conta, somados os modelos dela, passam do que resta, descontada a margem. */
  'quota',
  /** A maquina nao tem um requisito fixo da task. */
  'fixed-requirement',
  /** O modelo nao cobre a dificuldade estimada. */
  'competence',
  /** A liberacao do acesso nao cobre a sensibilidade da task. */
  'data',
  /** Uma dependencia nao esta no plano, ou esta no mesmo momento ou depois. */
  'dependency',
  /** Mais atribuicoes num momento do que a maquina comporta. */
  'concurrency',
  /** Task interativa num momento sem presenca. */
  'presence',
  /** O plano cita task, acesso, modelo ou maquina que o problema nao tem, ou atribui a mesma task duas vezes. */
  'unknown-reference',
] as const;

export type ConstraintCode = (typeof CONSTRAINT_CODES)[number];

export interface ConstraintViolation {
  readonly code: ConstraintCode;
  /** As tasks envolvidas. */
  readonly tasks: readonly TaskRef[];
  readonly detail: string;
}

export interface DeferredTask {
  readonly task: TaskRef;
  /** A restricao que impediu atribuir a task agora. */
  readonly reason: ConstraintCode;
}

export interface SuggestedPlan {
  readonly plan: Plan;
  readonly score: PlanScore;
  readonly deferred: readonly DeferredTask[];
}

export type SchedulerPorts = Record<never, never>;

export type SchedulerEvents = {
  readonly 'scheduler:plan-suggested': {
    readonly assignments: readonly Assignment[];
    readonly deferred: readonly DeferredTask[];
    readonly total: number;
  };
};
