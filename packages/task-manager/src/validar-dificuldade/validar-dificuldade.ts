import { TaskSchema } from '@opentask/taskin-types';

/*
 * A faixa e perguntada ao schema do dominio, como faz o lint do provider de
 * arquivos: repetir `1` e `5` aqui seria mais uma copia a mao do que o schema
 * ja sabe.
 */
const aceita = (n: number) => TaskSchema.shape.difficulty.safeParse(n).success;

/** A menor dificuldade aceita. @public */
export const DIFICULDADE_MINIMA = (() => {
  let n = 0;
  while (!aceita(n) && n < 100) n++;
  return n;
})();

/** A maior dificuldade aceita. @public */
export const DIFICULDADE_MAXIMA = (() => {
  let n = DIFICULDADE_MINIMA;
  while (aceita(n + 1)) n++;
  return n;
})();

/**
 * Confere uma dificuldade vinda de fora — uma flag, um argumento de ferramenta,
 * o quadro — antes de ela chegar a um arquivo.
 *
 * @returns O mesmo numero, quando valido
 * @throws Error dizendo a faixa, quando nao
 * @public
 */
export function validarDificuldade(valor: number): number {
  if (!Number.isInteger(valor) || valor < DIFICULDADE_MINIMA || valor > DIFICULDADE_MAXIMA) {
    throw new Error(
      `Invalid difficulty: ${valor}. Use a whole number from ${DIFICULDADE_MINIMA} to ${DIFICULDADE_MAXIMA}.`,
    );
  }
  return valor;
}
