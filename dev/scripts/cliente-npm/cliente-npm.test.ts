import { describe, expect, it } from 'vitest';
import { argumentosDeConfianca, versaoAtende } from './cliente-npm';

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

describe('argumentosDeConfianca', () => {
  const alvo = { pacote: '@rinhany/core', repositorio: 'sidartaveloso/rinhany', workflow: 'release.yml' };

  it('monta o npm trust github do pacote', () => {
    expect(argumentosDeConfianca(alvo)).toEqual([
      'trust',
      'github',
      '@rinhany/core',
      '--repo',
      'sidartaveloso/rinhany',
      '--file',
      'release.yml',
      '--allow-publish',
      '--yes',
    ]);
  });

  it('passa o codigo de 2FA num argumento so, que o npm trust nao le como posicional', () => {
    const argumentos = argumentosDeConfianca(alvo, '123456');

    expect(argumentos.at(-1)).toBe('--otp=123456');
    expect(argumentos).not.toContain('123456');
  });
});
