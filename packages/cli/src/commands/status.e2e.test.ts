import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };
const SEGREDO = 'valor-secreto-9f8e7d';

let raiz: string;
let casa: string;

const tarefa = (id: string, status: string, extra = '') => `# 🧩 Task ${id} — Tarefa ${id}

- Status: ${status}
- Type: feat
- Assignee: Alguem
${extra}
## Description
Existe para o quadro.

## Tasks
- [ ] Nada

## Notes
Nada.
`;

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; saida: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], {
      cwd: raiz,
      env: { ...process.env, HOME: casa, SITUATION_TOKEN: SEGREDO },
    });
    return { code: 0, stdout, saida: stdout + stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', saida: `${falha.stdout ?? ''}${falha.stderr ?? ''}` };
  }
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-status-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-status-home-'));
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
  writeFileSync(join(raiz, 'TASKS', 'task-001-primeira.md'), tarefa('001', 'in-progress'));
  writeFileSync(join(raiz, 'TASKS', 'task-002-segunda.md'), tarefa('002', 'pending', '- Requires: quantum-computer\n'));
  writeFileSync(join(raiz, 'TASKS', 'task-003-feita.md'), tarefa('003', 'done'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
  rmSync(casa, { recursive: true, force: true });
});

describe('taskin status, pelo binario', LENTO, () => {
  it('o texto abre pela task em andamento e diz quais rodam aqui', async () => {
    const { code, stdout, saida } = await rodar('status');
    expect(code, saida).toBe(0);
    expect(stdout.indexOf('001')).toBeGreaterThan(-1);
    expect(stdout.indexOf('001')).toBeLessThan(stdout.indexOf('this-machine'));
    expect(stdout).toContain('claude-main');
    expect(stdout).toMatch(/002 .*does not run here \(missing: quantum-computer\)/);
    expect(stdout).not.toMatch(/003/);
  });

  it('--json e --format json dao o mesmo contrato, com version', async () => {
    const a = await rodar('status', '--json');
    const b = await rodar('status', '--format', 'json');
    expect(a.code, a.saida).toBe(0);
    const parsed = JSON.parse(a.stdout);
    expect(parsed.version).toBe(1);
    expect(parsed.current.id).toBe('001');
    expect(parsed.accesses[0]).toMatchObject({ name: 'claude-main', available: true });
    expect(Object.keys(JSON.parse(b.stdout))).toEqual(Object.keys(parsed));
  });

  it('html e md mostram so nomes logicos: nem segredo, nem hostname', async () => {
    for (const formato of ['html', 'md']) {
      const { code, stdout, saida } = await rodar('status', '--format', formato);
      expect(code, saida).toBe(0);
      expect(stdout).toContain('claude-main');
      expect(stdout).not.toContain(SEGREDO);
      expect(stdout).not.toContain('SITUATION_TOKEN');
      expect(stdout).not.toContain(hostname());
    }
  });

  it('recusa formato desconhecido', async () => {
    const { code, saida } = await rodar('status', '--format', 'xml');
    expect(code).toBe(1);
    expect(saida).toMatch(/Unknown format/);
  });
});
