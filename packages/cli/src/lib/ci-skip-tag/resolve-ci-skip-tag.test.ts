import { describe, expect, it } from 'vitest';
import { resolveCiSkipTag } from './resolve-ci-skip-tag.js';

/**
 * Quem decide a marca: o projeto, e a chamada quando ela discorda.
 *
 * A configuracao (`automation.ciSkipTag`) esta certa para um push que so muda
 * status. Mas o GitHub le **apenas o commit de topo** do push: quando o
 * trabalho e o `finish` vao juntos, o commit de status fica por cima e a marca
 * pula o pipeline inteiro — inclusive o release do trabalho que acabou de sair.
 *
 * Dai a excecao por chamada. Ela so desliga: forcar a marca num projeto que
 * pediu "CI sempre" seria opcao sem uso real.
 */
describe('resolveCiSkipTag', () => {
  it('sem a flag, vale o que o projeto configurou', () => {
    expect(resolveCiSkipTag('[skip ci]', undefined)).toBe('[skip ci]');
  });

  it('respeita uma marca propria do projeto', () => {
    expect(resolveCiSkipTag('***NO_CI***', undefined)).toBe('***NO_CI***');
  });

  /* O commander da `true` quando um `--no-x` **nao** foi passado. */
  it('trata o padrao do commander como ausencia da flag', () => {
    expect(resolveCiSkipTag('[skip ci]', true)).toBe('[skip ci]');
  });

  it('com --no-skip-ci, nao marca nada', () => {
    expect(resolveCiSkipTag('[skip ci]', false)).toBe('');
  });

  /*
   * Sem configuracao e sem flag nao ha o que dizer, e `undefined` e diferente
   * de `''`: o primeiro deixa o GitService aplicar o seu padrao, o segundo
   * afirma "sem marca".
   */
  it('nao inventa resposta quando ninguem disse nada', () => {
    expect(resolveCiSkipTag(undefined, undefined)).toBeUndefined();
  });

  it('a flag vence mesmo sem configuracao', () => {
    expect(resolveCiSkipTag(undefined, false)).toBe('');
  });

  it('projeto que ja pediu CI sempre continua sem marca', () => {
    expect(resolveCiSkipTag('', undefined)).toBe('');
    expect(resolveCiSkipTag('', false)).toBe('');
  });
});
