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

function commitarEm(data: string, mensagem: string) {
  execFileSync('git', ['commit', '-q', '-m', mensagem], {
    cwd: raiz,
    env: { ...process.env, GIT_AUTHOR_DATE: data, GIT_COMMITTER_DATE: data },
  });
}

const ANTIGA = 'task-027-abrir-portas.md';
const NOVA = 'task-027-fechar-portas.md';
const RENUMERADA = 'task-029-fechar-portas.md';

function escrever(nome: string, numero: string, titulo: string, status: string) {
  writeFileSync(
    join(tasks, nome),
    `# 🧩 Task ${numero} — ${titulo}\n\n- Status: ${status}\n- Type: feat\n- Assignee: ana\n\n## Description\nx\n\n## Tasks\n- [x] Feito\n\n## Notes\nNada.\n`,
  );
}

async function provider(): Promise<FileSystemTaskProvider> {
  const registry = new UserRegistry({ taskinDir: join(raiz, TASKIN_DIR_NAME) });
  await registry.load();
  return new FileSystemTaskProvider(tasks, registry);
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-lint-numero-repetido-'));
  tasks = join(raiz, 'TASKS');
  mkdirSync(tasks);
  mkdirSync(join(raiz, TASKIN_DIR_NAME));
  writeFileSync(
    join(raiz, TASKIN_DIR_NAME, USERS_FILE_NAME),
    JSON.stringify({ users: { ana: { id: 'ana', name: 'Ana', email: 'ana@example.com' } } }),
  );
  git('init', '-q');
  git('config', 'user.email', 'teste@example.com');
  git('config', 'user.name', 'Teste');
  git('config', 'commit.gpgsign', 'false');

  escrever(ANTIGA, '027', 'Abrir portas', 'done');
  escrever('task-028-outra.md', '028', 'Outra', 'pending');
  git('add', '.');
  commitarEm('2026-01-01T10:00:00', 'a primeira 027');

  escrever(NOVA, '027', 'Fechar portas', 'in-progress');
  writeFileSync(join(raiz, 'README.md'), `Ver [fechar](TASKS/${NOVA}).\nA task-027 e citada solta.\n`);
  git('add', '.');
  commitarEm('2026-02-01T10:00:00', 'a segunda 027');
  git('branch', 'feat/task-027');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Dois arquivos com o mesmo numero (task-209): o `lint` acusa, o `findTask`
 * recusa em vez de escolher um, e o `lint --fix` renumera a mais nova.
 */
describe('FileSystemTaskProvider — numero de task repetido', () => {
  it('o lint acusa como erro, citando os caminhos, e nao mexe em nada', async () => {
    const resultado = await (await provider()).lint(false);

    const erro = resultado.issues.find((i) => i.severity === 'error' && i.message.includes('027'));
    expect(erro?.message).toContain(`TASKS/${ANTIGA}`);
    expect(erro?.message).toContain(`TASKS/${NOVA}`);
    expect(resultado.valid).toBe(false);
    expect(git('status', '--porcelain')).toBe('');
  });

  it('o findTask recusa o numero repetido com a mesma mensagem, em vez de pegar um dos arquivos', async () => {
    const p = await provider();
    const erro = (await p.lint(false)).issues.find((i) => i.severity === 'error' && i.message.includes('027'));

    await expect(p.findTask('027' as never)).rejects.toThrow(erro?.message ?? 'sem erro no lint');
    expect((await p.findTask('028' as never))?.title).toBe('Outra');
  });

  it('o --fix renumera a mais nova, ajusta a referencia e mostra o que fez e o que ficou para decidir', async () => {
    const p = await provider();
    const resultado = await p.lint(true);

    expect(readdirSync(tasks).sort()).toEqual([ANTIGA, 'task-028-outra.md', RENUMERADA].sort());
    expect(readFileSync(join(raiz, 'README.md'), 'utf-8')).toBe(
      `Ver [fechar](TASKS/${RENUMERADA}).\nA task-027 e citada solta.\n`,
    );
    expect(resultado.issues.some((i) => i.severity === 'error')).toBe(false);

    const mensagens = resultado.issues.map((i) => `${i.severity} ${i.message}`);
    expect(mensagens).toContainEqual(expect.stringMatching(new RegExp(`^info Renumbered ${NOVA} → ${RENUMERADA}`)));
    expect(mensagens).toContainEqual(expect.stringMatching(/^info Rewrote 1 reference\(s\) to .* in README\.md/));
    expect(mensagens).toContainEqual(expect.stringMatching(/^warning .*README\.md:2.*task-027/));
    expect(mensagens).toContainEqual(expect.stringMatching(/^warning Branch feat\/task-027 /));

    expect((await p.findTask('029' as never))?.title).toBe('Fechar portas');
    expect((await p.findTask('027' as never))?.title).toBe('Abrir portas');
  });

  it('um segundo --fix nao muda nada', async () => {
    await (await provider()).lint(true);
    git('add', '-A');
    commitarEm('2026-03-01T10:00:00', 'renumera');

    const resultado = await (await provider()).lint(true);

    expect(git('status', '--porcelain')).toBe('');
    expect(resultado.issues.some((i) => /Renumbered|Rewrote|Branch|loose/.test(i.message))).toBe(false);
  });
});
