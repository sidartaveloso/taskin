import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA } from '@opentask/taskin-task-manager';
import type { Brand, Juiz } from '@rinhany/core';
import type { CompetitorEstimate } from '../competitors/competitors.types';
import type { CompetitorMeasures, DifficultyMetrics, DifficultyResult } from './difficulty-judge.types';

export const RANKING_ACCURACY = 'accuracy';
export const RANKING_CALIBRATION = 'calibration';
export const RANKING_SPEED = 'speed';

/** Task sem resposta conta como o maior erro da escala: quem nao responde nao escapa das dificeis. */
export const WORST_ERROR = DIFICULDADE_MAXIMA - DIFICULDADE_MINIMA;

type CompetitorId = Brand<string, 'AlgoritmoId'>;

export function measureAnswer(expected: number, estimate: CompetitorEstimate): DifficultyMetrics {
  const absoluteError = Math.abs(estimate.difficulty - expected);
  return {
    expected,
    estimated: estimate.difficulty,
    absoluteError,
    exact: absoluteError === 0,
    withinOne: absoluteError <= 1,
    confidence: estimate.confidence,
  };
}

export function measureCompetitor(resultados: readonly DifficultyResult[]): CompetitorMeasures {
  const respostas = resultados.flatMap((r) =>
    r.metricas && !r.erro ? [{ metricas: r.metricas, ms: r.tempo_execucao_ms, saida: r.saida }] : [],
  );
  const total = resultados.length;
  const failed = total - respostas.length;
  const soma = (f: (m: DifficultyMetrics) => number) => respostas.reduce((acc, r) => acc + f(r.metricas), 0);
  const razao = (parte: number) => (total === 0 ? 0 : parte / total);
  const comConfianca = respostas.flatMap((r) => (r.metricas.confidence === undefined ? [] : [r.metricas]));

  return {
    answered: respostas.length,
    failed,
    meanAbsoluteError: razao(soma((m) => m.absoluteError) + failed * WORST_ERROR),
    exactRate: razao(soma((m) => (m.exact ? 1 : 0))),
    withinOneRate: razao(soma((m) => (m.withinOne ? 1 : 0))),
    brier:
      comConfianca.length === 0
        ? undefined
        : comConfianca.reduce((acc, m) => acc + ((m.confidence ?? 0) - (m.exact ? 1 : 0)) ** 2, 0) /
          comConfianca.length,
    meanLatencyMs: respostas.length === 0 ? 0 : respostas.reduce((acc, r) => acc + r.ms, 0) / respostas.length,
    inputTokens: respostas.reduce((acc, r) => acc + (r.saida?.inputTokens ?? 0), 0),
    firstError: resultados.find((r) => r.erro)?.erro?.mensagem,
  };
}

/**
 * O juiz da rinha de dificuldade: acerto contra a nota humana primeiro — o
 * primeiro ranking decide o vencedor do rinhany. Quem nao respondeu nenhuma
 * task nao entra em ranking nenhum: nao perde, nao rodou (W.O.).
 */
export class DifficultyJudge implements Juiz<DifficultyResult> {
  julgar(resultados: readonly DifficultyResult[]): ReadonlyMap<string, readonly CompetitorId[]> {
    const porCompetidor = new Map<CompetitorId, DifficultyResult[]>();
    for (const r of resultados) porCompetidor.set(r.algoritmo_id, [...(porCompetidor.get(r.algoritmo_id) ?? []), r]);

    const medidos = [...porCompetidor]
      .map(([id, rs]) => ({ id, m: measureCompetitor(rs) }))
      .filter(({ m }) => m.answered > 0);

    const ordenar = (comparar: (a: CompetitorMeasures, b: CompetitorMeasures) => number, lista = medidos) =>
      [...lista].sort((a, b) => comparar(a.m, b.m) || a.id.localeCompare(b.id)).map(({ id }) => id);

    return new Map<string, readonly CompetitorId[]>([
      [RANKING_ACCURACY, ordenar(compararAcerto)],
      [
        RANKING_CALIBRATION,
        ordenar(
          (a, b) => (a.brier ?? 0) - (b.brier ?? 0),
          medidos.filter(({ m }) => m.brier !== undefined),
        ),
      ],
      [RANKING_SPEED, ordenar((a, b) => a.meanLatencyMs - b.meanLatencyMs)],
    ]);
  }
}

/** Menor erro medio; empate vai para quem acerta em cheio mais vezes, e depois para quem chega a ±1. */
export function compararAcerto(a: CompetitorMeasures, b: CompetitorMeasures): number {
  return a.meanAbsoluteError - b.meanAbsoluteError || b.exactRate - a.exactRate || b.withinOneRate - a.withinOneRate;
}
