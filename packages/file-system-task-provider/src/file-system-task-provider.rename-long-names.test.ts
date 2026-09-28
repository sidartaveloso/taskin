import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

let raiz: string;
let tasks: string;

const git = (...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });

const TITULO =
  'Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte';
const LONGO =
  'task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas-pelo-dominio-e-na-url-e-o-titulo-do-quadro-segue-o-recorte.md';
const CURTO = 'task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas.md';
const OUTRA = 'task-130-depende.md';

async function provider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(raiz, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasks, registry);
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-lint-rename-'));
  tasks = join(raiz, 'TASKS');
  mkdirSync(tasks);
  mkdirSync(join(raiz, TASKIN_DIR_NAME));
  writeFileSync(
    join(raiz, TASKIN_DIR_NAME, USERS_FILE_NAME),
    JSON.stringify({ users: { ana: { id: 'ana', name: 'Ana', email: 'ana@example.com' } } }),
  );
  writeFileSync(
    join(tasks, LONGO),
    `# 🧩 Task 129 — ${TITULO}\n\n- Status: pending\n- Type: feat\n- Assignee: ana\n\n## Description\nx\n`,
  );
  writeFileSync(
    join(tasks, OUTRA),
    `# 🧩 Task 130 — Depende\n\n- Status: pending\n- Type: feat\n- Assignee: ana\n\n## Notes\nVer TASKS/${LONGO}.\n`,
  );
  git('init', '-q');
  git('config', 'user.email', 'teste@example.com');
  git('config', 'user.name', 'Teste');
  git('config', 'commit.gpgsign', 'false');
  git('add', '.');
  git('commit', '-q', '-m', 'inicio');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * O `taskin lint` avisa o arquivo de nome longo, e o `lint --fix` o renomeia
 * pelo provider de arquivos, por `git mv` (task-140).
 */
describe('FileSystemTaskProvider.lint — nome de arquivo longo', () => {
  it('sem --fix, avisa com o nome que o --fix daria, e nao mexe em nada', async () => {
    const resultado = await (await provider()).lint(false);

    const aviso = resultado.issues.find((i) => i.file.endsWith(LONGO) && i.message.includes('File name is longer'));
    expect(aviso?.severity).toBe('warning');
    expect(aviso?.suggestion).toContain(CURTO);
    expect(readdirSync(tasks).sort()).toEqual([OUTRA, LONGO].sort());
  });

  it('com --fix, renomeia por git mv, reescreve a referencia, e a task continua legivel', async () => {
    const p = await provider();
    const resultado = await p.lint(true);

    expect(readdirSync(tasks).sort()).toEqual([CURTO, OUTRA].sort());
    expect(git('status', '--porcelain')).toContain(`R  TASKS/${LONGO} -> TASKS/${CURTO}`);
    expect(readFileSync(join(tasks, OUTRA), 'utf-8')).toContain(`Ver TASKS/${CURTO}.`);

    const info = resultado.issues.find((i) => i.severity === 'info' && i.message.includes(CURTO));
    expect(info?.message).toContain('git mv');
    expect(resultado.issues.some((i) => i.message.includes('File name is longer'))).toBe(false);

    const task = (await p.getAllTasks()).find((t) => t.id === '129');
    expect(task?.title).toBe(TITULO);
    expect(task?.filePath).toBe(join(tasks, CURTO));
  });

  it('depois do --fix e do commit, o git log --follow atravessa o renome', async () => {
    await (await provider()).lint(true);
    git('add', '-A');
    git('commit', '-q', '-m', 'encurta o nome');

    expect(git('log', '--follow', '--format=%s', '--', `TASKS/${CURTO}`).trim().split('\n')).toEqual([
      'encurta o nome',
      'inicio',
    ]);
  });

  it('um segundo --fix nao faz nada', async () => {
    await (await provider()).lint(true);
    const antes = readdirSync(tasks).sort();

    const resultado = await (await provider()).lint(true);

    expect(readdirSync(tasks).sort()).toEqual(antes);
    expect(resultado.issues.some((i) => i.severity === 'info' && i.message.includes('Renamed'))).toBe(false);
  });

  it('quando o nome novo ja existe, o --fix recusa e diz por que', async () => {
    writeFileSync(
      join(tasks, CURTO),
      `# 🧩 Task 129 — Outra\n\n- Status: pending\n- Type: feat\n\n## Description\ny\n`,
    );

    const resultado = await (await provider()).lint(true);

    expect(readdirSync(tasks)).toContain(LONGO);
    const recusa = resultado.issues.find((i) => i.file.endsWith(LONGO) && i.message.includes('already exists'));
    expect(recusa?.severity).toBe('warning');
  });
});
