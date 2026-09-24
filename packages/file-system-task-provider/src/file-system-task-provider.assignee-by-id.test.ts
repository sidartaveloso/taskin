import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

/*
 * O `Assignee:` de uma task guarda o id do registro, e nao o nome de exibicao.
 *
 * O nome muda (casamento, grafia, acento); o id e a chave estavel pela qual o
 * registro, o `stats --team` e os filtros por assignee se encontram. Hoje o
 * `createTask` resolve o id e grava `user.name`, e o lint aceita o nome calado
 * porque `resolveUser` tambem casa pelo nome.
 */

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

describe('FileSystemTaskProvider — o Assignee guarda o id', () => {
  it('createTask grava o id quando recebe o id', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'josedasilva' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: josedasilva$/m);
    expect(created).not.toContain('José da Silva');
  });

  it('createTask grava o id mesmo quando recebe o nome de exibicao', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'José da Silva' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: josedasilva$/m);
  });

  // Quem nao esta no registro nao tem id. O que `createTemporaryUser` inventa
  // (`fulano-de-tal`) esconderia do lint o valor que ele precisa mostrar.
  it('createTask grava como foi digitado quem nao esta no registro', async () => {
    const provider = await makeProvider();

    const { task } = await provider.createTask({ title: 'Nova', type: 'feat', assignee: 'Fulano de Tal' });
    const created = readFileSync(join(tasksDir, `task-${task.id}-nova.md`), 'utf-8');

    expect(created).toMatch(/^- Assignee: Fulano de Tal$/m);
    expect((await provider.lint()).issues.some((issue) => issue.message.includes('Fulano de Tal'))).toBe(true);
  });

  it('lint avisa quando o Assignee e o nome de exibicao, e sugere o id', async () => {
    writeTask('001', 'José da Silva');

    const result = await (await makeProvider()).lint();

    const issue = result.issues.find((candidate) => candidate.message.includes('José da Silva'));
    expect(issue?.severity).toBe('warning');
    expect(issue?.suggestion).toContain('josedasilva');
  });

  it('lint --fix reescreve o nome de exibicao para o id', async () => {
    const filePath = writeTask('002', 'José da Silva');
    const provider = await makeProvider();

    await provider.lint(true);

    expect(readFileSync(filePath, 'utf-8')).toMatch(/^- Assignee: josedasilva$/m);
    expect((await provider.lint()).issues).toEqual([]);
  });
});
