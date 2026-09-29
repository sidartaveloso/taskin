import type { ICalibration } from '../calibration/calibration.types';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { EstimatorOutcome } from '../estimator-router/estimator-router.types';
import type { SuggestionSource, SuggestionSourceId } from '../estimators/estimators.types';

/** O que Jev e Laya dizem de cada task, e qual das notas vale como sugestao. */
export interface IDifficultySuggester {
  /** Fonte calibrada sem `calibration` nao sugere nada: a nota crua dela e outra escala. */
  suggest(
    tasks: readonly TaskForEstimate[],
    source?: SuggestionSource,
    calibration?: ICalibration,
  ): Promise<readonly Suggestion[]>;
}

export interface Suggestion {
  readonly task: { readonly id: string; readonly title: string };
  readonly outcomes: readonly EstimatorOutcome[];
  /** Os dois responderam a mesma nota. Sem as duas respostas, nao se sabe. */
  readonly agreement?: boolean;
  /** A nota da fonte escolhida, quando ela respondeu. */
  readonly chosen?: { readonly source: SuggestionSourceId; readonly difficulty: number };
}

/** De quem e a nota que vale: a fonte escolhida, ou por que nao ha fonte. */
export type SourceChoice =
  | { readonly kind: 'chosen'; readonly source: SuggestionSource; readonly why: string }
  | { readonly kind: 'none'; readonly why: string };
