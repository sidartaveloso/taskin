import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

let projectRoot: string;
let tasksDir: string;

async function makeProvider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasksDir, registry);
}

function writeTask(id: string, assignee: string): string {
  const filePath = join(tasksDir, `task-${id}-alvo.md`);
  writeFileSync(
    filePath,
    `# Task ${id} — Alvo\n\n- Status: pending\n- Type: feat\n- Assignee: ${assignee}\n\n## Description\n\nx\n`,
    'utf-8',
  );
  return filePath;
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-assignee-id-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
  mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
  writeFileSync(
    join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME),
    JSON.stringify({ users: { josedasilva: { id: 'josedasilva', name: 'José da Silva', email: 'jose@example.com' } } }),
    'utf-8',
  );
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('FileSystemTaskProvider — the Assignee line stores the registry id', () => {
  it('createTask writes the id when given the id', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'josedasilva' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: josedasilva$/m);
    expect(created).not.toContain('José da Silva');
  });

  it('createTask writes the id when given the display name', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'José da Silva' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: josedasilva$/m);
  });

  it('createTask writes someone outside the registry as typed', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'Fulano de Tal' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: Fulano de Tal$/m);
    expect((await provider.lint()).issues.some((issue) => issue.message.includes('Fulano de Tal'))).toBe(true);
  });

  it('lint warns about a display name and suggests the id', async () => {
    writeTask('001', 'José da Silva');

    const result = await (await makeProvider()).lint();

    const issue = result.issues.find((candidate) => candidate.message.includes('José da Silva'));
    expect(issue?.severity).toBe('warning');
    expect(issue?.suggestion).toContain('josedasilva');
  });

  it('lint --fix rewrites a display name into the id', async () => {
    const filePath = writeTask('002', 'José da Silva');
    const provider = await makeProvider();

    await provider.lint(true);

    expect(readFileSync(filePath, 'utf-8')).toMatch(/^- Assignee: josedasilva$/m);
    expect((await provider.lint()).issues).toEqual([]);
  });
});
