import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };
const SEGREDO = 'valor-secreto-a1b2c3';

let raiz: string;
let casa: string;
let estado: string;

const ambiente = () => ({ ...process.env, HOME: casa, XDG_STATE_HOME: estado, SITUATION_TOKEN: SEGREDO });
const leases = () => join(estado, 'taskin', 'leases.json');

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd: raiz, env: ambiente() });
    return { code: 0, stdout, stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', stderr: falha.stderr ?? '' };
  }
}

/** Um comando que prova, sem imprimir o segredo, que ele chegou ao ambiente. */
const conferirSegredo = (saida: number) =>
  `process.exit(process.env.ANTHROPIC_API_KEY === ${JSON.stringify(SEGREDO)} ? ${saida} : 99)`;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-access-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-access-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-access-state-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
      resources: {
        offers: [
          {
            kind: 'access',
            name: 'claude-main',
            accessKind: 'llm',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'ANTHROPIC_API_KEY',
          },
        ],
        restrictPersonalMachines: false,
        clearances: {},
      },
    }),
  );
});

afterEach(() => {
  for (const dir of [raiz, casa, estado]) rmSync(dir, { recursive: true, force: true });
});

describe('taskin access', LENTO, () => {
  it('run empresta, o comando ve o segredo no ambiente, sai com o codigo do comando e devolve', async () => {
    const r = await rodar('access', 'run', 'llm', '--task', '7', '--', 'node', '-e', conferirSegredo(3));

    expect(r.code).toBe(3);
    expect(r.stderr).toContain('claude-main');
    expect(existsSync(leases())).toBe(true);
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
  });

  it('o segredo nunca aparece no stdout, no stderr nem no leases.json, e status mostra o nome logico', async () => {
    const filho = spawn(
      'node',
      [CLI, 'access', 'run', 'llm', '--task', '42', '--', 'node', '-e', 'setTimeout(() => {}, 20000)'],
      { cwd: raiz, env: ambiente() },
    );
    let saidaDoFilho = '';
    filho.stdout.on('data', (d) => (saidaDoFilho += d));
    filho.stderr.on('data', (d) => (saidaDoFilho += d));
    while (!existsSync(leases()) || JSON.parse(readFileSync(leases(), 'utf8')).active.length === 0) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const status = await rodar('access', 'status');
    const json = await rodar('access', 'status', '--json');
    const arquivo = readFileSync(leases(), 'utf8');
    const saiu = new Promise<number | null>((resolve) => filho.on('exit', (code) => resolve(code)));
    filho.kill('SIGINT');
    const codigo = await saiu;

    expect(status.stdout).toContain('claude-main');
    expect(status.stdout).toContain('task 42');
    expect(JSON.parse(json.stdout)).toMatchObject([{ access: 'claude-main', task: '42', shared: false }]);
    for (const texto of [status.stdout, status.stderr, json.stdout, json.stderr, arquivo, saidaDoFilho]) {
      expect(texto).not.toContain(SEGREDO);
    }
    expect(codigo).toBe(130);
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
    expect((await rodar('access', 'status')).stdout).toContain('No open leases');
  });

  it('o comando que falha tambem devolve o emprestimo', async () => {
    const r = await rodar('access', 'run', 'llm', '--', 'node', '-e', 'process.exit(1)');

    expect(r.code).toBe(1);
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
  });

  it('negado, sai com erro e o motivo, sem rodar o comando', async () => {
    const marca = join(raiz, 'rodou');
    const semTipo = await rodar(
      'access',
      'run',
      'gpu',
      '--',
      'node',
      '-e',
      `require('fs').writeFileSync(${JSON.stringify(marca)}, '')`,
    );
    const semLiberacao = await rodar('access', 'run', 'llm', '--sensitivity', 'sensitive', '--', 'node', '-e', '0');

    expect(semTipo.code).toBe(1);
    expect(semTipo.stderr).toContain('no-access-of-kind');
    expect(existsSync(marca)).toBe(false);
    expect(semLiberacao.code).toBe(1);
    expect(semLiberacao.stderr).toContain('no-cleared-access');
  });
});
