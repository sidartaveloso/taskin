import { EventEmitter } from 'node:events';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { argumentosDeConfianca, ClienteNpm, versaoAtende } from './cliente-npm';

const spawnDoNpm = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', async (original) => ({
  ...(await original<typeof import('node:child_process')>()),
  spawn: spawnDoNpm,
}));

/** O npm falso termina com `codigo` e, se houver `log`, grava-o na pasta de `--logs-dir`. */
function npmQueTermina(codigo: number, log?: string): void {
  spawnDoNpm.mockImplementation((_binario: string, argumentos: string[]) => {
    const processo = new EventEmitter();
    const pastaDeLogs = argumentos
      .find((argumento) => argumento.startsWith('--logs-dir='))
      ?.slice('--logs-dir='.length);
    if (log !== undefined && pastaDeLogs) {
      writeFileSync(join(pastaDeLogs, '2026-11-18T19_23_55_085Z-debug-0.log'), log);
    }
    queueMicrotask(() => processo.emit('close', codigo));
    return processo;
  });
}

function argumentosDoUltimoNpm(): string[] {
  return spawnDoNpm.mock.lastCall?.[1] ?? [];
}

const LOG_DO_409 = [
  '0 verbose cli /usr/local/bin/node /usr/local/bin/npm',
  '45 verbose stack HttpErrorGeneral: 409 Conflict - POST https://registry.npmjs.org/-/package/taskin/trust - a trusted publisher configuration that a token could also match already exists for this package',
  '50 error code E409',
].join('\n');

const LOG_DO_EOTP = ['50 error code EOTP', '51 error This operation requires a one-time password.'].join('\n');

afterEach(() => {
  spawnDoNpm.mockReset();
});

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

describe('ClienteNpm no modo interativo', () => {
  const alvo = { pacote: 'taskin', repositorio: 'sidartaveloso/taskin', workflow: 'release.yml' };
  const interativo = () => new ClienteNpm('/sem/npm/aqui', { tipo: 'interativo' });

  it('da ao npm trust o terminal inteiro, para ele conduzir o 2FA pelo navegador', async () => {
    npmQueTermina(0);

    await interativo().confiarEmGithubActions(alvo);

    expect(spawnDoNpm).toHaveBeenCalledWith('/sem/npm/aqui', expect.arrayContaining(['trust', 'github', 'taskin']), {
      stdio: 'inherit',
    });
  });

  it('aponta o log do npm para uma pasta propria', async () => {
    npmQueTermina(0);

    await interativo().confiarEmGithubActions(alvo);

    expect(argumentosDoUltimoNpm().filter((argumento) => argumento.startsWith('--logs-dir='))).toHaveLength(1);
  });

  it('da ao npm login o terminal inteiro', async () => {
    npmQueTermina(0);

    await interativo().autenticar();

    expect(spawnDoNpm).toHaveBeenCalledWith('/sem/npm/aqui', expect.arrayContaining(['login']), { stdio: 'inherit' });
  });

  it('configura quando o npm sai com 0', async () => {
    npmQueTermina(0);

    await expect(interativo().confiarEmGithubActions(alvo)).resolves.toEqual({ tipo: 'configurado' });
  });

  it('le o 409 no log do npm como pacote ja configurado', async () => {
    npmQueTermina(1, LOG_DO_409);

    await expect(interativo().confiarEmGithubActions(alvo)).resolves.toEqual({ tipo: 'ja-configurado' });
  });

  it('relata outra falha com o codigo de saida do npm', async () => {
    npmQueTermina(1, LOG_DO_EOTP);

    await expect(interativo().confiarEmGithubActions(alvo)).resolves.toEqual({
      tipo: 'falha',
      motivo: 'npm saiu com codigo 1',
    });
  });

  it('apaga a pasta de logs no fim', async () => {
    npmQueTermina(1, LOG_DO_409);

    await interativo().confiarEmGithubActions(alvo);

    const pastaDeLogs = argumentosDoUltimoNpm()
      .find((argumento) => argumento.startsWith('--logs-dir='))
      ?.slice('--logs-dir='.length);
    expect(pastaDeLogs).toBeDefined();
    expect(existsSync(pastaDeLogs as string)).toBe(false);
  });
});
