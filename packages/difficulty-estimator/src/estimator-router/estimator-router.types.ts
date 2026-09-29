import type { EstimatedDifficulty, TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { RemoteEstimatorId, UnavailableEstimator } from '../estimators/estimators.types';

/** Pergunta ao Jev e ao Laya de uma vez, e diz o que cada um respondeu — ou por que nao. */
export interface IEstimatorRouter {
  /** Confere quem esta no ar antes de comecar; quem nao estiver fica indisponivel, com o motivo. */
  probe(): Promise<void>;
  unavailable(): readonly UnavailableEstimator[];
  /** Um resultado por modelo, na ordem de `REMOTE_ESTIMATORS`. */
  ask(task: TaskForEstimate): Promise<readonly EstimatorOutcome[]>;
}

export type EstimatorOutcome =
  | {
      readonly kind: 'answered';
      readonly estimator: RemoteEstimatorId;
      readonly estimate: EstimatedDifficulty;
      readonly latencyMs: number;
      readonly inputTokens: number;
      readonly fromCache: boolean;
    }
  | {
      readonly kind: 'failed';
      readonly estimator: RemoteEstimatorId;
      readonly reason: string;
      readonly latencyMs: number;
    }
  | {
      readonly kind: 'unavailable';
      readonly estimator: RemoteEstimatorId;
      readonly reason: string;
    };

export interface EstimatorRouterOptions {
  /** `false` pergunta de novo mesmo com resposta guardada (a guardada e substituida). */
  readonly useCache?: boolean;
}
