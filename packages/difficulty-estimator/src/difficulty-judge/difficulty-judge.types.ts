import type { BaseResultado } from '@rinhany/core';
import type { CompetitorEstimate } from '../competitors/competitors.types';

/** Uma resposta contra a nota humana. */
export interface DifficultyMetrics {
  readonly expected: number;
  readonly estimated: number;
  readonly absoluteError: number;
  readonly exact: boolean;
  readonly withinOne: boolean;
  readonly confidence?: number;
}

/** Quando o competidor nao respondeu, o rinhany guarda `erro` e deixa `saida` e `metricas` vazias. */
export type DifficultyResult = BaseResultado<CompetitorEstimate | undefined, DifficultyMetrics | undefined>;

/** O desempenho de um competidor numa rinha. */
export interface CompetitorMeasures {
  readonly answered: number;
  readonly failed: number;
  readonly meanAbsoluteError: number;
  readonly exactRate: number;
  readonly withinOneRate: number;
  readonly brier?: number;
  readonly meanLatencyMs: number;
  readonly inputTokens: number;
  /** O primeiro motivo de nao ter respondido, se houve. */
  readonly firstError?: string;
}
