import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isTrackedByGit, moveFile } from './file-move';

let raiz: string;

const git = (...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });

function iniciarGit() {
  git('init', '-q');
  git('config', 'user.email', 'teste@example.com');
  git('config', 'user.name', 'Teste');
  git('config', 'commit.gpgsign', 'false');
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-file-move-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Mover preservando o historico quando da (task-140, extraido do que a task-085
 * escreveu para o registro de usuarios).
 */
describe('moveFile', () => {
  it('arquivo versionado vai por git mv: o indice registra um rename', async () => {
    iniciarGit();
    writeFileSync(join(raiz, 'antigo.md'), 'conteudo\n');
    git('add', 'antigo.md');
    git('commit', '-q', '-m', 'inicio');

    const { viaGit } = await moveFile(raiz, join(raiz, 'antigo.md'), join(raiz, 'novo.md'));

    expect(viaGit).toBe(true);
    expect(git('status', '--porcelain').trim()).toBe('R  antigo.md -> novo.md');
    expect(readFileSync(join(raiz, 'novo.md'), 'utf-8')).toBe('conteudo\n');
  });

  it('depois do commit, o git log --follow atravessa o rename', async () => {
    iniciarGit();
    writeFileSync(join(raiz, 'antigo.md'), 'conteudo\n');
    git('add', 'antigo.md');
    git('commit', '-q', '-m', 'nasce com o nome antigo');

    await moveFile(raiz, join(raiz, 'antigo.md'), join(raiz, 'novo.md'));
    git('commit', '-q', '-m', 'renomeia');

    const historico = git('log', '--follow', '--format=%s', '--', 'novo.md').trim().split('\n');
    expect(historico).toEqual(['renomeia', 'nasce com o nome antigo']);
  });

  it('arquivo nao versionado, dentro de um repositorio, vai por rename comum', async () => {
    iniciarGit();
    writeFileSync(join(raiz, 'solto.md'), 'x\n');

    const { viaGit } = await moveFile(raiz, join(raiz, 'solto.md'), join(raiz, 'movido.md'));

    expect(viaGit).toBe(false);
    expect(existsSync(join(raiz, 'solto.md'))).toBe(false);
    expect(existsSync(join(raiz, 'movido.md'))).toBe(true);
  });

  it('sem Git nenhum, vai por rename comum', async () => {
    writeFileSync(join(raiz, 'antigo.md'), 'x\n');

    const { viaGit } = await moveFile(raiz, join(raiz, 'antigo.md'), join(raiz, 'novo.md'));

    expect(viaGit).toBe(false);
    expect(existsSync(join(raiz, 'novo.md'))).toBe(true);
  });

  it('cria o diretorio de destino quando ele nao existe', async () => {
    writeFileSync(join(raiz, 'antigo.md'), 'x\n');

    await moveFile(raiz, join(raiz, 'antigo.md'), join(raiz, 'sub', 'dir', 'novo.md'));

    expect(existsSync(join(raiz, 'sub', 'dir', 'novo.md'))).toBe(true);
  });
});

describe('isTrackedByGit', () => {
  it('distingue versionado de nao versionado, e fora de repositorio e falso', () => {
    writeFileSync(join(raiz, 'fora.md'), 'x\n');
    expect(isTrackedByGit(raiz, join(raiz, 'fora.md'))).toBe(false);

    iniciarGit();
    mkdirSync(join(raiz, 'd'));
    writeFileSync(join(raiz, 'd', 'dentro.md'), 'x\n');
    expect(isTrackedByGit(raiz, join(raiz, 'd', 'dentro.md'))).toBe(false);
    git('add', '.');
    expect(isTrackedByGit(raiz, join(raiz, 'd', 'dentro.md'))).toBe(true);
  });
});
