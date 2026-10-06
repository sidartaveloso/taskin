import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { SuggestionSourceId, UnavailableEstimator } from '../estimators/estimators.types';

/** A rinha Jev x Laya (e os pisos) contra as notas que uma pessoa ja deu. */
export interface IDifficultyBenchmark {
  run(answerKey: readonly AnswerKeyEntry[], onProgress?: (done: number, total: number) => void): Promise<Scoreboard>;
}

/** Uma task e a nota humana. A nota fica com o juiz; o competidor so recebe a `task`. */
export interface AnswerKeyEntry {
  readonly task: TaskForEstimate;
  readonly difficulty: number;
}

export type CompetitorKind = 'model' | 'baseline';

export interface CompetitorScore {
  readonly competitor: string;
  readonly kind: CompetitorKind;
  readonly answered: number;
  readonly failed: number;
  /** Erro absoluto medio; task sem resposta conta como o pior erro possivel. */
  readonly meanAbsoluteError: number;
  readonly exactRate: number;
  readonly withinOneRate: number;
  /** Media de (confianca - acertou)^2. So existe para quem manda confianca. */
  readonly brier?: number;
  readonly meanLatencyMs: number;
  readonly inputTokens: number;
  /** Nao respondeu nenhuma task: nao entra em ranking, e o outro ganha por W.O. */
  readonly didNotRun?: string;
}

export interface BestModel {
  /** O modelo, cru (`jev`) ou calibrado pelas notas humanas (`jev-calibrated`). */
  readonly source: SuggestionSourceId;
  /** Algum dos modelos nao rodou. */
  readonly byWalkover: boolean;
  /** Erra menos que o melhor piso; se nao, nao merece sugerir. */
  readonly beatsBaselines: boolean;
}

export interface ScoreboardTask {
  readonly taskId: string;
  readonly title: string;
  readonly expected: number;
  readonly estimates: Readonly<Record<string, number | null>>;
}

export interface Scoreboard {
  /** 2 desde que o melhor modelo pode ser calibrado (`bestModel.source`). */
  readonly schema: 2;
  readonly questionVersion: number;
  readonly generatedAt: string;
  readonly answerKeySize: number;
  /** Na ordem do ranking de acerto; quem nao rodou vem por ultimo. */
  readonly competitors: readonly CompetitorScore[];
  readonly rankings: Readonly<Record<string, readonly string[]>>;
  readonly winner?: string;
  readonly bestModel?: BestModel;
  /** Os modelos que nao rodaram, e por que. */
  readonly walkovers: readonly UnavailableEstimator[];
  readonly tasks: readonly ScoreboardTask[];
}
