import { validarDificuldade } from '@opentask/taskin-task-manager';
import type { ISharedAsk } from '../competitors/competitors.types';
import type { AnswerKeyEntry } from '../difficulty-benchmark/difficulty-benchmark.types';
import type { RemoteEstimatorId } from '../estimators/estimators.types';
import type { CalibrationPair, ICalibration } from './calibration.types';

/** Menos que isso nao e calibracao, e chute com outro nome. */
export const MIN_CALIBRATION_PAIRS = 5;

/**
 * Calibracao por posicao: o `score` entra entre os `score`s que o modelo deu
 * as tasks ja pontuadas, e sai a nota humana da mesma posicao. Nao importa
 * se o modelo chuta alto ou baixo, so a ordem em que ele poe as tasks — e a
 * saida tem a distribuicao das notas de quem pontua.
 */
export class QuantileCalibration implements ICalibration {
  private readonly scores: readonly number[];
  private readonly notas: readonly number[];

  constructor(pairs: readonly CalibrationPair[]) {
    if (pairs.length < MIN_CALIBRATION_PAIRS) {
      throw new Error(`A calibration needs at least ${MIN_CALIBRATION_PAIRS} human scores, got ${pairs.length}.`);
    }
    this.scores = pairs.map((p) => p.score).sort((a, b) => a - b);
    this.notas = pairs.map((p) => p.human).sort((a, b) => a - b);
  }

  get size(): number {
    return this.notas.length;
  }

  difficultyFor(score: number): number {
    const abaixo = this.scores.filter((s) => s < score).length;
    const iguais = this.scores.filter((s) => s === score).length;
    // Empate conta pela metade; o piso faz um score igual a um aprendido cair na mesma posicao dele.
    const posicao = Math.min(this.notas.length - 1, Math.floor(abaixo + iguais / 2));
    return validarDificuldade(this.notas[posicao] ?? this.notas[this.notas.length - 1] ?? 0);
  }
}

/** Os pares (score do modelo, nota humana) das tasks do gabarito que o modelo respondeu. */
export async function calibrationPairs(
  entries: readonly AnswerKeyEntry[],
  estimator: RemoteEstimatorId,
  ask: ISharedAsk,
): Promise<CalibrationPair[]> {
  const pares: CalibrationPair[] = [];
  for (const entrada of entries) {
    const resultado = await ask.outcome(entrada.task, estimator);
    if (resultado.kind === 'answered') pares.push({ score: resultado.estimate.score, human: entrada.difficulty });
  }
  return pares;
}
