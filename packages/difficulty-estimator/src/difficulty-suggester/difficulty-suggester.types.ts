import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { EstimatorOutcome } from '../estimator-router/estimator-router.types';
import type { RemoteEstimatorId } from '../estimators/estimators.types';

/** O que Jev e Laya dizem de cada task, e qual das notas vale como sugestao. */
export interface IDifficultySuggester {
  suggest(tasks: readonly TaskForEstimate[], by?: RemoteEstimatorId): Promise<readonly Suggestion[]>;
}

export interface Suggestion {
  readonly task: { readonly id: string; readonly title: string };
  readonly outcomes: readonly EstimatorOutcome[];
  /** Os dois responderam a mesma nota. Sem as duas respostas, nao se sabe. */
  readonly agreement?: boolean;
  /** A nota de `by`, quando ele respondeu. */
  readonly chosen?: { readonly estimator: RemoteEstimatorId; readonly difficulty: number };
}

/** De quem e a nota que vale: o escolhido, ou por que nao ha escolhido. */
export type EstimatorChoice =
  | { readonly kind: 'chosen'; readonly estimator: RemoteEstimatorId; readonly why: string }
  | { readonly kind: 'none'; readonly why: string };
