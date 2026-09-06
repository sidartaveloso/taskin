import { parseTaskId } from '@opentask/taskin-types';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

let projectRoot: string;
let tasksDir: string;

function writeTask(id: string, assignee: string): string {
  const filePath = join(tasksDir, `task-${id}-alvo.md`);
  writeFileSync(
    filePath,
    `# Task ${id} — Alvo\n\nStatus: pending\nType: feat\nAssignee: ${assignee}\n\n## Description\n\nx\n`,
    'utf-8',
  );
  return filePath;
}

function writeRegistry(users: Record<string, { id: string; name: string; email: string }>): void {
  mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
  writeFileSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME), JSON.stringify({ users }), 'utf-8');
}

async function makeProvider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasksDir, registry);
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-assignees-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
  writeRegistry({ 'ana-souza': { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' } });
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('FileSystemTaskProvider.lint — assignees', () => {
  it('warns about an assignee that resolves to nobody', async () => {
    writeTask('001', 'fernandogatti');

    const result = await (await makeProvider()).lint();

    const issue = result.issues.find((candidate) => candidate.message.includes('fernandogatti'));
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('warning');
    expect(issue?.file).toContain('task-001-alvo.md');
  });

  it('warns with a suggestion when the spelling folds onto exactly one user', async () => {
    writeTask('002', 'anasouza');

    const result = await (await makeProvider()).lint();

    const issue = result.issues.find((candidate) => candidate.message.includes('anasouza'));
    expect(issue?.severity).toBe('warning');
    expect(issue?.suggestion).toContain('ana-souza');
  });

  it('says nothing about a resolved assignee or a placeholder', async () => {
    writeTask('003', 'Ana Souza');
    writeTask('004', 'A definir');

    const result = await (await makeProvider()).lint();

    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('rewrites the unambiguous spelling with --fix, preserving the rest of the task', async () => {
    const filePath = writeTask('005', 'anasouza');

    await (await makeProvider()).lint(true);

    /*
     * Nao da para comparar o arquivo byte a byte: o `fixTaskFile` que ja existia
     * tambem normaliza as linhas de metadados, marcando a quebra forte.
     */
    const after = readFileSync(filePath, 'utf-8');
    expect(after).toMatch(/^Assignee: ana-souza\\$/m);
    expect(after).not.toContain('anasouza');
    expect(after).toContain('# Task 005 — Alvo');
    expect(after).toMatch(/^Status: pending\\$/m);
    expect(after).toMatch(/^Type: feat\\$/m);
    expect(after).toContain('## Description');
    expect(after).toContain('x');
  });

  it('leaves an unknown assignee untouched by --fix, and still reports it', async () => {
    const filePath = writeTask('006', 'fernandogatti');

    const result = await (await makeProvider()).lint(true);

    expect(readFileSync(filePath, 'utf-8')).toContain('Assignee: fernandogatti');
    expect(result.issues.some((candidate) => candidate.message.includes('fernandogatti'))).toBe(true);
  });

  it('passes lint after --fix has corrected what it could', async () => {
    writeTask('007', 'anasouza');
    const provider = await makeProvider();

    await provider.lint(true);

    expect((await provider.lint()).issues).toEqual([]);
  });

  // O initialize() antigo semeava `$USER` com email `<user>@example.com`; a
  // migracao do caminho traz esse usuario sintetico para o registro canonico.
  it('warns about a seeded synthetic user that no task references', async () => {
    writeRegistry({
      'ana-souza': { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' },
      developer: { id: 'developer', name: 'Developer', email: 'developer@example.com' },
    });
    writeTask('008', 'Ana Souza');

    const result = await (await makeProvider()).lint();

    const issue = result.issues.find((candidate) => candidate.message.includes('developer'));
    expect(issue?.severity).toBe('warning');
    expect(issue?.suggestion).toBeDefined();
  });

  it('says nothing about a synthetic user that a task still points at', async () => {
    writeRegistry({ developer: { id: 'developer', name: 'Developer', email: 'developer@example.com' } });
    writeTask('009', 'developer');

    const result = await (await makeProvider()).lint();

    expect(result.issues).toEqual([]);
  });

  it('does not mistake a real user for a seeded one just because of the email domain', async () => {
    writeRegistry({ 'ana-souza': { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' } });

    const result = await (await makeProvider()).lint();

    expect(result.issues).toEqual([]);
  });

  /*
   * A quebra forte faz parte da formatacao da linha, nao do valor. Se ela
   * vazar para o valor, `Status: pending\\` deixa de ser um status valido e
   * `Assignee: ana-souza\\` deixa de resolver — em todo arquivo ja normalizado.
   */
  it('reads a task written with the hard break without swallowing it into the value', async () => {
    writeFileSync(
      join(tasksDir, 'task-010-quebra.md'),
      '# Task 010 — Quebra\n\nStatus: in-progress\\\nType: fix\\\nAssignee: ana-souza\\\n\n## Description\n\nx\n',
      'utf-8',
    );

    const provider = await makeProvider();
    const [task] = await provider.getAllTasks();

    expect(task?.status).toBe('in-progress');
    expect(task?.type).toBe('fix');
    expect(task?.assignee?.id).toBe('ana-souza');
    expect((await provider.lint()).issues).toEqual([]);
  });

  /*
   * A quebra forte e escrita pelo `lint --fix`, mas quem *cria* e quem *atualiza*
   * a task tambem precisa aplica-la — senao `taskin new` e `taskin start`
   * produzem arquivo que o proprio lint considera fora do padrao.
   */
  it('writes the hard break when creating a task', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'ana-souza' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^Status: pending\\$/m);
    expect(created).toMatch(/^Type: feat\\$/m);
    expect(created).toMatch(/^Assignee: .*\\$/m);
  });

  it('keeps the hard break when updating a status', async () => {
    const filePath = writeTask('011', 'ana-souza');
    const provider = await makeProvider();

    const task = await provider.findTask(parseTaskId('011'));
    await provider.updateTask({ ...(task as NonNullable<typeof task>), status: 'in-progress' });

    expect(readFileSync(filePath, 'utf-8')).toMatch(/^Status: in-progress\\$/m);
  });
});
