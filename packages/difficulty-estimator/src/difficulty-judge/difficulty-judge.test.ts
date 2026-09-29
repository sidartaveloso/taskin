import type { Brand } from '@rinhany/core';
import { describe, expect, it } from 'vitest';
import { DifficultyJudge, measureAnswer, measureCompetitor, WORST_ERROR } from './difficulty-judge';
import type { DifficultyResult } from './difficulty-judge.types';

let seq = 0;
const resultado = (
  competidor: string,
  esperado: number,
  estimado: number | 'nao rodou',
  confidence?: number,
): DifficultyResult => {
  const base = {
    algoritmo_id: competidor as Brand<string, 'AlgoritmoId'>,
    dataset_id: `t${seq++}` as Brand<string, 'DatasetId'>,
    timestamp: new Date(),
  };
  if (estimado === 'nao rodou') {
    return {
      ...base,
      saida: undefined,
      metricas: undefined,
      tempo_execucao_ms: 0,
      erro: { mensagem: `${competidor} is down` },
    };
  }
  const saida = { difficulty: estimado, confidence, latencyMs: 10, inputTokens: 5 };
  return { ...base, saida, metricas: measureAnswer(esperado, saida), tempo_execucao_ms: 10 };
};

describe('measureCompetitor', () => {
  it('measures error, exact hits and ±1 against the human score', () => {
    const m = measureCompetitor([resultado('a', 2, 2), resultado('a', 3, 4), resultado('a', 1, 4)]);
    expect(m.answered).toBe(3);
    expect(m.meanAbsoluteError).toBeCloseTo((0 + 1 + 3) / 3);
    expect(m.exactRate).toBeCloseTo(1 / 3);
    expect(m.withinOneRate).toBeCloseTo(2 / 3);
    expect(m.inputTokens).toBe(15);
  });

  it('counts a task without an answer as the worst error, and as a miss', () => {
    const m = measureCompetitor([resultado('a', 2, 2), resultado('a', 5, 'nao rodou')]);
    expect(m).toMatchObject({ answered: 1, failed: 1, exactRate: 0.5, firstError: 'a is down' });
    expect(m.meanAbsoluteError).toBe(WORST_ERROR / 2);
  });

  it('computes the Brier score only for who sends confidence', () => {
    expect(measureCompetitor([resultado('a', 2, 2, 0.8), resultado('a', 2, 3, 0.8)]).brier).toBeCloseTo(
      (0.04 + 0.64) / 2,
    );
    expect(measureCompetitor([resultado('a', 2, 2)]).brier).toBeUndefined();
  });
});

describe('DifficultyJudge', () => {
  const julgar = (rs: DifficultyResult[]) => new DifficultyJudge().julgar(rs);

  it('ranks accuracy by mean error, first — the rinhany winner', () => {
    const rankings = julgar([
      resultado('laya', 2, 3),
      resultado('laya', 4, 4),
      resultado('always-2', 2, 2),
      resultado('always-2', 4, 2),
    ]);
    expect([...rankings.keys()][0]).toBe('accuracy');
    expect(rankings.get('accuracy')).toEqual(['laya', 'always-2']);
  });

  it('breaks a tie on error by exact hits', () => {
    const rankings = julgar([resultado('a', 3, 2), resultado('a', 3, 4), resultado('b', 3, 3), resultado('b', 3, 5)]);
    expect(rankings.get('accuracy')).toEqual(['b', 'a']);
  });

  it('leaves out of every ranking whoever answered nothing', () => {
    const rankings = julgar([resultado('jev', 2, 'nao rodou'), resultado('laya', 2, 5)]);
    for (const ranking of rankings.values()) expect(ranking).not.toContain('jev');
    expect(rankings.get('accuracy')).toEqual(['laya']);
  });

  it('has no winner when nobody answered', () => {
    expect(julgar([resultado('jev', 2, 'nao rodou')]).get('accuracy')).toEqual([]);
  });

  it('ranks calibration only among who sends confidence', () => {
    const rankings = julgar([resultado('laya', 2, 2, 0.9), resultado('always-2', 2, 2)]);
    expect(rankings.get('calibration')).toEqual(['laya']);
  });
});
