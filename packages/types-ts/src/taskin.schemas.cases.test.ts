import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type MascotNoiseSettings,
  resolveMascotNoiseSettings,
  resolveShhhReactionPlan,
  type ShhhReactionPlan,
} from './taskin.schemas';

// Lidas do disco, e nao importadas: o `tsc` do build compila os testes junto, e
// importar o JSON levaria as tabelas para o `dist` publicado.
const lerTabela = <T>(nome: string): { cases: T[] } =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${nome}`, import.meta.url), 'utf8'));

const casosDeAjustes = lerTabela<{
  nome: string;
  mascot: unknown;
  expected: { settings: MascotNoiseSettings } | { invalid: true };
}>('mascot-noise-settings.cases.json');

const casosDoPlano = lerTabela<{
  input: { sound: boolean; prefersReducedMotion?: boolean };
  expected: ShhhReactionPlan;
}>('shhh-reaction-plan.cases.json');

/**
 * As duas tabelas sao o contrato com o porte em Kotlin do app do relogio
 * (`packages/mascote-wear`): os dois lados rodam os mesmos casos.
 */
describe('resolveMascotNoiseSettings contra a tabela compartilhada com o Kotlin', () => {
  it.each(casosDeAjustes.cases.map((c) => [c.nome, c] as const))('%s', (_nome, c) => {
    const resolver = () => resolveMascotNoiseSettings(c.mascot as never);

    if ('invalid' in c.expected) {
      expect(resolver).toThrow();
    } else {
      expect(resolver()).toEqual(c.expected.settings);
    }
  });
});

describe('resolveShhhReactionPlan contra a tabela compartilhada com o Kotlin', () => {
  it.each(casosDoPlano.cases.map((c) => [JSON.stringify(c.input), c] as const))('%s', (_nome, c) => {
    expect(resolveShhhReactionPlan(c.input)).toEqual(c.expected);
  });
});
