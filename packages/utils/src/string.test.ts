/**
 * Tests for string utilities
 */

import { describe, expect, it } from 'vitest';
import { slugify } from './string';

describe('slugify', () => {
  it('should remove accents from Portuguese characters', () => {
    expect(slugify('Exclusão de propagação')).toBe('exclusao-de-propagacao');
    expect(slugify('Configuração Avançada')).toBe('configuracao-avancada');
    expect(slugify('Ação de Integração')).toBe('acao-de-integracao');
  });

  it('should remove accents from various languages', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('naïve')).toBe('naive');
    expect(slugify('Zürich')).toBe('zurich');
    expect(slugify('São Paulo')).toBe('sao-paulo');
  });

  it('should convert to lowercase', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
    expect(slugify('MixedCase Text')).toBe('mixedcase-text');
  });

  it('should replace spaces and special characters with hyphens', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('test@example.com')).toBe('test-example-com');
    expect(slugify('one  two   three')).toBe('one-two-three');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(slugify('-leading')).toBe('leading');
    expect(slugify('trailing-')).toBe('trailing');
    expect(slugify('-both-')).toBe('both');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('should handle strings with only special characters', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('---')).toBe('');
  });

  it('should handle complex real-world examples', () => {
    expect(slugify('Feature: Implementação da API REST')).toBe('feature-implementacao-da-api-rest');
    expect(slugify('Bug: Correção no módulo de autenticação')).toBe('bug-correcao-no-modulo-de-autenticacao');
    expect(slugify('Docs: Atualização do README.md')).toBe('docs-atualizacao-do-readme-md');
  });

  it('should preserve numbers', () => {
    expect(slugify('Task 123')).toBe('task-123');
    expect(slugify('Version 2.0.1')).toBe('version-2-0-1');
  });
});

describe('slugify com maxLength', () => {
  it('sem maxLength, nao corta nada', () => {
    const longo = 'uma frase bem longa que passa de qualquer limite razoavel para nome de arquivo';
    expect(slugify(longo)).toBe(longo.replace(/ /g, '-'));
  });

  it('corta na ultima fronteira de palavra que cabe', () => {
    expect(slugify('Levar uma task para o topo da lista visivel', { maxLength: 20 })).toBe('levar-uma-task-para');
  });

  it('nunca termina em hifen', () => {
    const slug = slugify('abc defghij klm', { maxLength: 4 });
    expect(slug).toBe('abc');
    expect(slug.endsWith('-')).toBe(false);
  });

  it('corta no meio quando a primeira palavra sozinha ja passa do limite', () => {
    expect(slugify('supercalifragilistico expialidoso', { maxLength: 10 })).toBe('supercalif');
  });

  it('respeita o limite contando depois de tirar acentos', () => {
    const slug = slugify('Configuração Avançada da Integração', { maxLength: 25 });
    expect(slug.length).toBeLessThanOrEqual(25);
    expect(slug).toBe('configuracao-avancada-da');
  });

  it('o que ja cabe sai inteiro', () => {
    expect(slugify('Curto', { maxLength: 50 })).toBe('curto');
  });
});
