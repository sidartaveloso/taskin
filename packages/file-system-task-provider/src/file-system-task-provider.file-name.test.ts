import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider, TASK_FILE_SLUG_MAX_LENGTH } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

let projectRoot: string;
let tasksDir: string;

async function makeProvider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasksDir, registry);
}

const TITULO_LONGO =
  'Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte';

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-file-name-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
  mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
  writeFileSync(
    join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME),
    JSON.stringify({ users: { ana: { id: 'ana', name: 'Ana', email: 'ana@example.com' } } }),
    'utf-8',
  );
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

/**
 * O nome do arquivo e `task-NNN-` mais o titulo em slug. O titulo pode ser
 * longo; o nome nao precisa acompanhar (task-139).
 */
describe('FileSystemTaskProvider — o nome do arquivo da task', () => {
  it('corta o trecho do titulo no limite, numa fronteira de palavra', async () => {
    const { filePath } = await (await makeProvider()).createTask({
      title: TITULO_LONGO,
      type: 'feat',
      assignee: 'ana',
    });
    const nome = basename(filePath);
    const trecho = nome.replace(/^task-\d+-/, '').replace(/\.md$/, '');

    expect(trecho.length).toBeLessThanOrEqual(TASK_FILE_SLUG_MAX_LENGTH);
    expect(trecho.endsWith('-')).toBe(false);
    expect('busca-ordem-e-pontuacao-valem-para-as-duas-telas-pelo-dominio'.startsWith(trecho)).toBe(true);
  });

  it('o titulo completo continua no arquivo, so o nome e que encurta', async () => {
    const { task } = await (await makeProvider()).createTask({ title: TITULO_LONGO, type: 'feat', assignee: 'ana' });
    expect(task.title).toBe(TITULO_LONGO);
  });

  it('titulo curto sai inteiro no nome', async () => {
    const { filePath } = await (await makeProvider()).createTask({ title: 'Login', type: 'feat', assignee: 'ana' });
    expect(basename(filePath)).toBe('task-001-login.md');
  });

  it('dois titulos iguais nunca geram o mesmo nome', async () => {
    const provider = await makeProvider();
    const a = await provider.createTask({ title: 'Mesmo titulo', type: 'feat', assignee: 'ana' });
    const b = await provider.createTask({ title: 'Mesmo titulo', type: 'feat', assignee: 'ana' });

    expect(basename(a.filePath)).toBe('task-001-mesmo-titulo.md');
    expect(basename(b.filePath)).toBe('task-002-mesmo-titulo.md');
    expect(readdirSync(tasksDir).sort()).toEqual(['task-001-mesmo-titulo.md', 'task-002-mesmo-titulo.md']);
  });

  it('dois titulos longos que so diferem depois do corte tambem nao colidem', async () => {
    const provider = await makeProvider();
    const a = await provider.createTask({ title: `${TITULO_LONGO} — versao A`, type: 'feat', assignee: 'ana' });
    const b = await provider.createTask({ title: `${TITULO_LONGO} — versao B`, type: 'feat', assignee: 'ana' });

    const semNumero = (p: string) => basename(p).replace(/^task-\d+-/, '');
    expect(semNumero(a.filePath)).toBe(semNumero(b.filePath));
    expect(basename(a.filePath)).not.toBe(basename(b.filePath));
    expect(readdirSync(tasksDir)).toHaveLength(2);
  });

  it('titulo sem letra nem digito gera task-NNN.md, e nao task-NNN-.md', async () => {
    const { filePath } = await (await makeProvider()).createTask({ title: '!!! ???', type: 'feat', assignee: 'ana' });
    expect(basename(filePath)).toBe('task-001.md');
  });
});
