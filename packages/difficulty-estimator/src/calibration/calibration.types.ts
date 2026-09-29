/** Traduz o `score` de um modelo para a escala de quem pontua as tasks. */
export interface ICalibration {
  /** Quantas notas humanas a calibracao aprendeu. */
  readonly size: number;
  difficultyFor(score: number): number;
}

/** O que um modelo disse de uma task e a nota que uma pessoa deu a ela. */
export interface CalibrationPair {
  readonly score: number;
  readonly human: number;
}
