/** O que um estimador recebe de uma task: nunca a nota que ela ja tem. */
export interface TaskForEstimate {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  /** O markdown da task sem nenhuma linha de dificuldade. */
  readonly markdown: string;
}

export interface EstimatedDifficulty {
  /** De 1 a 5, a escala do `TaskSchema.difficulty`. */
  readonly difficulty: number;
  /** O nivel esperado que o modelo devolveu, de 0 a 4. */
  readonly score: number;
  readonly confidence?: number;
  readonly probabilities: Readonly<Record<string, number>>;
}
