import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

/**
 * task-251: o numero da task nova sai do maior id entre a pasta local e as
 * outras fontes (worktrees e refs locais). Sem isso, duas worktrees criam a
 * mesma task-049.
 */

let raiz: string;
let tasks: string;

async function provider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(raiz, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasks, registry);
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-reserved-ids-'));
  tasks = join(raiz, 'TASKS');
  mkdirSync(tasks);
  mkdirSync(join(raiz, TASKIN_DIR_NAME));
  writeFileSync(join(raiz, TASKIN_DIR_NAME, USERS_FILE_NAME), JSON.stringify({ users: {} }));
  writeFileSync(join(tasks, 'task-003-local.md'), '# 🧩 Task 003 — Local\n\n- Status: pending\n- Type: feat\n');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('createTask com reservedTaskIds', () => {
  it('numera depois do maior id reservado por outra fonte', async () => {
    const created = await (await provider()).createTask({
      title: 'Nova',
      type: 'feat',
      reservedTaskIds: ['007', '005'],
    });

    expect(created.task.id).toBe('008');
  });

  it('id reservado menor que o local nao muda nada', async () => {
    const created = await (await provider()).createTask({ title: 'Nova', type: 'feat', reservedTaskIds: ['001'] });

    expect(created.task.id).toBe('004');
  });

  it('id reservado que nao e numero e ignorado', async () => {
    const created = await (await provider()).createTask({
      title: 'Nova',
      type: 'feat',
      reservedTaskIds: ['abc', ''],
    });

    expect(created.task.id).toBe('004');
  });
});
