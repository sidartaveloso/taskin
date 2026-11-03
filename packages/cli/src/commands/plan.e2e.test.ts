import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };
const SEGREDO = 'valor-secreto-9f8e7d';

let raiz: string;
let casa: string;
let estado: string;

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

// biome-ignore lint/suspicious/noExplicitAny: o JSON do plano lido sem o tipo
type Json = any;

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; saida: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], {
      cwd: raiz,
      env: { ...process.env, HOME: casa, XDG_STATE_HOME: estado, SITUATION_TOKEN: SEGREDO },
    });
    return { code: 0, stdout, saida: stdout + stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', saida: `${falha.stdout ?? ''}${falha.stderr ?? ''}` };
  }
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-plan-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-plan-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-plan-state-'));
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
        scheduling: { accesses: { 'claude-main': { model: 'claude-opus-5-5' } } },
      },
    }),
  );
  writeFileSync(join(raiz, 'TASKS', 'task-001-primeira.md'), tarefa('001', 'in-progress', '- Difficulty: 2\n'));
  writeFileSync(join(raiz, 'TASKS', 'task-002-segunda.md'), tarefa('002', 'pending', '- Requires: quantum-computer\n'));
  writeFileSync(join(raiz, 'TASKS', 'task-003-feita.md'), tarefa('003', 'done'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
  rmSync(casa, { recursive: true, force: true });
  rmSync(estado, { recursive: true, force: true });
});

describe('taskin plan, pelo binario', LENTO, () => {
  it('o texto sugere acesso, modelo e maquina, adia o requisito fixo ausente e diz que nao ha historico', async () => {
    const { code, stdout, saida } = await rodar('plan');
    expect(code, saida).toBe(0);
    expect(stdout).toContain('No run history yet: using the declared estimates.');
    expect(stdout).toMatch(/#1 Tarefa 001 → claude-main \(claude-opus-5-5\) on this-machine/);
    expect(stdout).toMatch(/Deferred:\n {2}#2 Tarefa 002 — fixed-requirement/);
    expect(stdout).not.toMatch(/Tarefa 003/);
    expect(stdout).not.toContain(SEGREDO);
  });

  it('--json e --format json dao o SuggestedPlan com version', async () => {
    const a = await rodar('plan', '--json');
    const b = await rodar('plan', '--format', 'json');
    expect(a.code, a.saida).toBe(0);
    const parsed: Json = JSON.parse(a.stdout);
    expect(parsed.version).toBe(1);
    expect(parsed.history).toBe(false);
    expect(parsed.deferred).toEqual([{ task: '2', reason: 'fixed-requirement' }]);
    expect(parsed.plan.assignments.map((x: Json) => x.task)).toEqual(['1']);
    expect(Object.keys(JSON.parse(b.stdout))).toEqual(Object.keys(parsed));
  });

  it('o historico do time calibra por modelo e o consumo da cota vem do estado da maquina', async () => {
    const config = JSON.parse(readFileSync(join(raiz, '.taskin.json'), 'utf8'));
    config.resources.scheduling = { accesses: { 'claude-main': { model: 'claude-opus-5-5', quota: 100_000 } } };
    writeFileSync(join(raiz, '.taskin.json'), JSON.stringify(config));
    mkdirSync(join(raiz, '.taskin'), { recursive: true });
    writeFileSync(
      join(raiz, '.taskin', 'runs.jsonl'),
      `${JSON.stringify({
        id: 'run-1',
        repository: 'repo',
        task: '1',
        estimated: 2,
        found: 2,
        model: 'claude-opus-5-5',
        tokens: 12_345,
        iterations: 1,
        completed: true,
        reworked: false,
        duration: 1000,
      })}\n`,
    );
    mkdirSync(join(estado, 'taskin'), { recursive: true });
    const id = `repository:${basename(raiz)}:claude-main`;
    writeFileSync(
      join(estado, 'taskin', 'runs.jsonl'),
      `${JSON.stringify({ state: 'finished', id: 'run-1', access: id, tokens: 90_000, finishedAt: Date.now() - 60_000 })}\n`,
    );

    const { code, stdout, saida } = await rodar('plan', '--json');

    expect(code, saida).toBe(0);
    const parsed: Json = JSON.parse(stdout);
    expect(parsed.history).toBe(true);
    expect(parsed.plan.problem.accesses[0].remaining).toBe(10_000);
    expect(parsed.plan.problem.tasks[0].estimatedTokens).toBe(12_345);
  });

  it('recusa formato desconhecido', async () => {
    const { code, saida } = await rodar('plan', '--format', 'html');
    expect(code).toBe(1);
    expect(saida).toMatch(/Unknown format/);
  });
});
