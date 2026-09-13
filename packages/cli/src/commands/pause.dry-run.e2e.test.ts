import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

let raiz: string;
let tarefaPath: string;

const TAREFA = `# 🧩 Task 001 — Uma tarefa qualquer

- Status: in-progress
- Type: chore
- Assignee: Alguem

## Description
Existe para o comando ter o que pausar.

## Tasks
- [ ] Nada

## Notes
Nada.
`;

async function rodar(...args: string[]) {
  const { stdout } = await execFileAsync('node', [CLI, ...args], { cwd: raiz });
  return stdout;
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });
}

function contarCommits() {
  return git('rev-list', '--count', 'HEAD').trim();
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-pause-dry-run-'));
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
  tarefaPath = join(raiz, 'TASKS', 'task-001-uma-tarefa-qualquer.md');
  writeFileSync(tarefaPath, TAREFA, 'utf-8');

  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('add', '-A');
  git('commit', '-q', '-m', 'estado inicial');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * O `--dry-run` de pause precisa provar duas coisas: que anuncia o que faria,
 * e que nao faz nada. Ver `finish.no-skip-ci.e2e.test.ts` como forma.
 */
describe('taskin pause --dry-run', () => {
  it('anuncia a transicao para paused e o commit que faria', async () => {
    const saida = await rodar('pause', '001', '--dry-run');

    expect(saida).toContain('Dry run');
    expect(saida).toContain('→ paused');
    expect(saida).toContain('git commit');
  });

  it('nao altera o status da task no arquivo', async () => {
    await rodar('pause', '001', '--dry-run');

    expect(readFileSync(tarefaPath, 'utf-8')).toContain('Status: in-progress');
  });

  it('nao cria commit novo', async () => {
    const antes = contarCommits();

    await rodar('pause', '001', '--dry-run');

    expect(contarCommits()).toBe(antes);
  });
});
