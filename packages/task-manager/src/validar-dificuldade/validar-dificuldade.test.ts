import { describe, expect, it } from 'vitest';
import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA, validarDificuldade } from './validar-dificuldade';

describe('validarDificuldade', () => {
  it('a faixa e a do schema: 1 a 5', () => {
    expect([DIFICULDADE_MINIMA, DIFICULDADE_MAXIMA]).toEqual([1, 5]);
  });

  it.each([1, 3, 5])('aceita %d e devolve o mesmo numero', (valor) => {
    expect(validarDificuldade(valor)).toBe(valor);
  });

  it.each([0, 6, 2.5, -1, Number.NaN])('recusa %d dizendo a faixa', (valor) => {
    expect(() => validarDificuldade(valor)).toThrow(/difficulty.*1 to 5/i);
  });
});
