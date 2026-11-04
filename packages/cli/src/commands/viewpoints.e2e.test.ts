import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };

let raiz: string;
let casa: string;
let estado: string;

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], {
      cwd: raiz,
      env: { ...process.env, HOME: casa, XDG_STATE_HOME: estado },
    });
    return { code: 0, stdout, stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', stderr: falha.stderr ?? '' };
  }
}

const recursos = () => join(casa, '.config', 'taskin', 'resources.json');
const noRepositorio = () =>
  readdirSync(raiz, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => readFileSync(join(e.parentPath, e.name), 'utf8'))
    .join('\n');

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-viewpoints-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-viewpoints-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-viewpoints-state-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(join(raiz, '.taskin.json'), JSON.stringify({ version: '1.0.3', provider: { type: 'fs' } }));
});

afterEach(() => {
  for (const dir of [raiz, casa, estado]) rmSync(dir, { recursive: true, force: true });
});

describe('taskin viewpoints', LENTO, () => {
  it('consent grava competencias, carga e horario na camada da pessoa; status mostra; withdraw retira', async () => {
    const dada = await rodar(
      'viewpoints',
      'consent',
      'design',
      'writing',
      '--weekly-load',
      '2',
      '--hours',
      '13:00-17:30',
      '--days',
      'mon,wed',
      '--utc-offset',
      '-180',
    );
    expect(dada.code).toBe(0);
    expect(dada.stdout).toContain('design, writing');

    const pessoal = JSON.parse(readFileSync(recursos(), 'utf8'));
    expect(Object.values(pessoal.viewpoints)).toEqual([
      {
        expertise: ['design', 'writing'],
        weeklyLoad: 2,
        hours: { weekdays: [1, 3], fromMinute: 780, toMinute: 1050, utcOffsetMinutes: -180 },
      },
    ]);

    const status = await rodar('viewpoints', 'status');
    expect(status.stdout).toContain('up to 2 a week; mon,wed 13:00-17:30 (UTC-03:00)');
    expect(status.stdout).toContain('No open requests');
    expect(JSON.parse((await rodar('viewpoints', 'status', '--json')).stdout).requests).toEqual([]);

    expect((await rodar('viewpoints', 'withdraw')).code).toBe(0);
    expect((await rodar('viewpoints', 'status')).stdout).toContain('No consent');
    expect(noRepositorio()).not.toMatch(/design|weeklyLoad|viewpoints/);
  });

  it('horario invalido e recusado com o motivo, sem gravar nada', async () => {
    const r = await rodar('viewpoints', 'consent', 'design', '--hours', '18:00-09:00');
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('start before end');
    expect(() => readFileSync(recursos(), 'utf8')).toThrow();
  });
});

describe('taskin channels', LENTO, () => {
  it('prefer grava os canais na ordem, ao lado do consentimento; status mostra', async () => {
    await rodar('viewpoints', 'consent', 'design');
    expect((await rodar('channels', 'prefer', 'watch', 'taskinboard')).code).toBe(0);

    const pessoal = JSON.parse(readFileSync(recursos(), 'utf8'));
    expect(Object.values(pessoal.channels)).toEqual([['watch', 'taskinboard']]);
    expect(Object.keys(pessoal).sort()).toEqual(['channels', 'viewpoints']);

    const status = await rodar('channels', 'status');
    expect(status.stdout).toContain('Channels, in order: watch, taskinboard.');
    expect(status.stdout).toContain('No notices waiting');
    expect(noRepositorio()).not.toContain('watch');
  });

  it('sem canal declarado, status diz que o aviso nao chega', async () => {
    expect((await rodar('channels', 'status')).stdout).toContain('No channel');
  });

  it('test entrega pelo canal console; flush sem nada esperando diz isso', async () => {
    await rodar('channels', 'prefer', 'console');
    const teste = await rodar('channels', 'test');
    expect(teste.code, teste.stderr).toBe(0);
    expect(teste.stdout).toContain('taskin: test notice');
    expect(teste.stdout).toContain('Delivered through console.');
    expect((await rodar('channels', 'flush')).stdout).toContain('No waiting notice');
  });

  it('test diz por que nenhum canal entregou: sem canal, e canal sem provedor', async () => {
    const semCanal = await rodar('channels', 'test');
    expect(semCanal.code).toBe(1);
    expect(semCanal.stdout).toContain('not declared any channel');

    await rodar('channels', 'prefer', 'tv-da-sala');
    const semProvedor = await rodar('channels', 'test');
    expect(semProvedor.code).toBe(1);
    expect(semProvedor.stdout).toContain('every channel of yours refused');
  });

  it('privacidade: webhook e token nunca aparecem no notices.json, na saida nem no repositorio', async () => {
    const webhook = 'http://127.0.0.1:1/hook-segredo-w7k2';
    const token = 'token-segredo-t9q4';
    writeFileSync(
      join(raiz, '.taskin.json'),
      JSON.stringify({
        version: '1.0.3',
        provider: { type: 'fs' },
        notifications: {
          discord: { webhookUrl: '${HOOK_URL}', events: ['task:done'] },
          telegram: { botToken: '${BOT_TOKEN}', chatId: '1', events: ['task:done'] },
        },
      }),
    );
    await rodar('channels', 'prefer', 'discord', 'telegram');
    const { stdout, stderr } = await execFileAsync('node', [CLI, 'channels', 'test'], {
      cwd: raiz,
      env: { ...process.env, HOME: casa, XDG_STATE_HOME: estado, HOOK_URL: webhook, BOT_TOKEN: token },
    }).catch((e: { stdout: string; stderr: string }) => e);
    const noticesFile = join(estado, 'taskin', 'notices.json');
    const tudo = [stdout, stderr, noRepositorio(), readFileSync(recursos(), 'utf8')];
    try {
      tudo.push(readFileSync(noticesFile, 'utf8'));
    } catch {
      // nada esperou: o arquivo nem precisa existir
    }
    for (const texto of tudo) {
      expect(texto).not.toContain('hook-segredo-w7k2');
      expect(texto).not.toContain('token-segredo-t9q4');
    }
  });
});
