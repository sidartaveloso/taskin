import { describe, expect, it } from 'vitest';
import { SharedAsk } from '../competitors/competitors';
import type { AnswerKeyEntry } from '../difficulty-benchmark/difficulty-benchmark.types';
import { EstimatorRouterMock } from '../estimator-router/estimator-router.mock';
import { calibrationPairs, MIN_CALIBRATION_PAIRS, QuantileCalibration } from './calibration';

/** Um modelo que chuta sempre um nivel e meio acima, mas na ordem certa. */
const ALTO = [
  { score: 2.4, human: 1 },
  { score: 3.1, human: 2 },
  { score: 3.2, human: 2 },
  { score: 3.3, human: 2 },
  { score: 3.8, human: 3 },
  { score: 4.0, human: 4 },
  { score: 4.4, human: 5 },
];

describe('QuantileCalibration', () => {
  const calibracao = new QuantileCalibration(ALTO);

  it('maps a score to the human score at the same position', () => {
    expect(calibracao.difficultyFor(2.0)).toBe(1);
    expect(calibracao.difficultyFor(3.25)).toBe(2);
    expect(calibracao.difficultyFor(3.9)).toBe(4);
    expect(calibracao.difficultyFor(9)).toBe(5);
  });

  it('takes out the offset of a model that always scores high, if it keeps the order', () => {
    const acertos = ALTO.filter((p) => calibracao.difficultyFor(p.score) === p.human).length;
    expect(acertos).toBe(ALTO.length);
  });

  it('only ever answers a human score it learned', () => {
    const notas = new Set(ALTO.map((p) => p.human));
    for (let s = 0; s <= 4; s += 0.1) expect(notas.has(calibracao.difficultyFor(s))).toBe(true);
  });

  it(`refuses fewer than ${MIN_CALIBRATION_PAIRS} human scores`, () => {
    expect(() => new QuantileCalibration(ALTO.slice(0, 4))).toThrow(/at least 5 human scores, got 4/);
  });

  it('says how many scores it learned', () => {
    expect(calibracao.size).toBe(7);
  });
});

describe('calibrationPairs', () => {
  const entrada = (id: string, difficulty: number): AnswerKeyEntry => ({
    task: { id, title: id, type: 'feat', markdown: '' },
    difficulty,
  });

  it("pairs the model's score with the human score, skipping what the model did not answer", async () => {
    const router = new EstimatorRouterMock({ jev: (t) => (t.id === '002' ? { falha: 'x' } : Number(t.id)) });
    const pares = await calibrationPairs(
      [entrada('001', 2), entrada('002', 5), entrada('003', 4)],
      'jev',
      new SharedAsk(router),
    );
    expect(pares).toEqual([
      { score: 1, human: 2 },
      { score: 3, human: 4 },
    ]);
  });
});
