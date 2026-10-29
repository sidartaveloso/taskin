import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

let raiz: string;

function tarefa(titulo: string, status: string) {
  return `# 🧩 Task 027 — ${titulo}

- Status: ${status}
- Type: chore
- Assignee: Alguem

## Description
Uma das duas 027.

## Tasks
- [x] Nada

## Notes
Nada.
`;
}

/** Roda o comando esperando falha; devolve o que ele disse e o codigo de saida. */
async function rodarFalhando(...args: string[]) {
  try {
    await execFileAsync('node', [CLI, ...args], { cwd: raiz });
  } catch (falha) {
    const { stdout, stderr, code } = falha as { stdout: string; stderr: string; code: number };
    return { saida: `${stdout}${stderr}`, code };
  }
  throw new Error(`taskin ${args.join(' ')} deveria ter falhado`);
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-numero-repetido-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'autopilot', autoSync: false, ciSkipTag: '[skip ci]' },
    }),
    'utf-8',
  );
  writeFileSync(join(raiz, 'TASKS', 'task-027-abrir-portas.md'), tarefa('Abrir portas', 'done'), 'utf-8');
  writeFileSync(join(raiz, 'TASKS', 'task-027-fechar-portas.md'), tarefa('Fechar portas', 'in-progress'), 'utf-8');

  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('checkout', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'estado inicial');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Dois arquivos com o mesmo numero (task-209): `start`, `review` e `finish`
 * recusam, com a mensagem do lint, em vez de agir sobre um deles.
 */
describe('numero de task repetido', () => {
  it.each(['start', 'review', 'finish'])('%s 027 recusa e cita os dois arquivos', async (comando) => {
    const { saida, code } = await rodarFalhando(comando, '027', '--dry-run');

    expect(code).toBe(1);
    expect(saida).toContain('TASKS/task-027-abrir-portas.md');
    expect(saida).toContain('TASKS/task-027-fechar-portas.md');
    expect(saida).toContain('lint --fix');
    // O start semeia `.taskin/` com o usuario corrente antes de procurar a task;
    // o que importa e nenhuma das duas 027 ter sido tocada nem commitada.
    expect(git('status', '--porcelain', '--untracked-files=no')).toBe('');
    expect(git('rev-list', '--count', 'HEAD').trim()).toBe('1');
  });

  it('o lint acusa o numero repetido como erro e sai com 1', async () => {
    const { saida, code } = await rodarFalhando('lint');

    expect(code).toBe(1);
    expect(saida).toContain('Task number 027 is used by 2 files');
  });
});
