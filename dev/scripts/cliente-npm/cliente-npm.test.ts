import { describe, expect, it } from 'vitest';
import { versaoAtende } from './cliente-npm';

describe('versaoAtende', () => {
  it.each([
    ['11.15.0', true],
    ['11.19.1', true],
    ['12.0.2', true],
    ['11.14.1', false],
    ['10.9.2', false],
  ])('npm %s -> %s', (versao, esperado) => {
    expect(versaoAtende(versao)).toBe(esperado);
  });

  it('compara o menor numericamente, nao como texto', () => {
    expect(versaoAtende('11.9.0')).toBe(false);
    expect(versaoAtende('11.100.0')).toBe(true);
  });
});
