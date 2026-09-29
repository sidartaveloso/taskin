import type { BaseAlgoritmo, Brand } from '@rinhany/core';
import type { CompetitorKind } from '../difficulty-benchmark/difficulty-benchmark.types';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { EstimatorOutcome } from '../estimator-router/estimator-router.types';
import type { RemoteEstimatorId } from '../estimators/estimators.types';

/** Um competidor da rinha: recebe a task sem a nota e devolve uma dificuldade — ou nao roda. */
export interface IDifficultyCompetitor extends BaseAlgoritmo<CompetitorConfig> {
  readonly kind: CompetitorKind;
  /** @throws CompetitorDidNotAnswer com o motivo, quando o competidor nao responde esta task */
  estimate(task: TaskForEstimate): Promise<CompetitorEstimate>;
}

export type CompetitorId = Brand<string, 'AlgoritmoId'>;

export type CompetitorConfig =
  | { readonly kind: 'model'; readonly estimator: RemoteEstimatorId }
  | { readonly kind: 'baseline'; readonly rule: string };

export interface CompetitorEstimate {
  readonly difficulty: number;
  readonly confidence?: number;
  readonly latencyMs: number;
  readonly inputTokens: number;
}

/**
 * Uma pergunta por task, dividida entre os modelos: a rinha chama o Jev e o
 * Laya um depois do outro, mas o `fan_out` ja trouxe os dois na primeira vez.
 */
export interface ISharedAsk {
  outcome(task: TaskForEstimate, estimator: RemoteEstimatorId): Promise<EstimatorOutcome>;
}
