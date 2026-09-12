import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

let raiz: string;

const TAREFA = `# 🧩 Task 001 — Uma tarefa qualquer

- Status: in-progress
- Type: chore
- Assignee: Alguem

## Description
Existe para o comando ter o que terminar.

## Tasks
- [x] Nada

## Notes
Nada.
`;

async function rodar(...args: string[]) {
  const { stdout } = await execFileAsync('node', [CLI, ...args], { cwd: raiz });
  return stdout;
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-no-skip-ci-'));
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
  writeFileSync(join(raiz, 'TASKS', 'task-001-uma-tarefa-qualquer.md'), TAREFA, 'utf-8');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * A marca de pular CI, decidida por chamada.
 *
 * O `--dry-run` e o ponto de observacao honesto aqui: ele imprime a mensagem de
 * commit que o projeto realmente faria, marca incluida, sem tocar em git.
 */
describe('taskin finish --no-skip-ci', () => {
  it('sem a flag, o commit de status leva a marca do projeto', async () => {
    const saida = await rodar('finish', '001', '--dry-run');

    expect(saida).toContain('[skip ci]');
  });

  /*
   * O caso que motivou a flag: o push carrega trabalho junto, o commit de
   * status fica no topo, e o GitHub — que le so o topo — pularia tudo.
   */
  it('com a flag, o commit de status sai limpo', async () => {
    const saida = await rodar('finish', '001', '--dry-run', '--no-skip-ci');

    expect(saida).not.toContain('[skip ci]');
    expect(saida).toContain('task-001');
  });
});
