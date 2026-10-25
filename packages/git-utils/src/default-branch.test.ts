import { execFileSync } from 'child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectDefaultBranch } from './default-branch';

/**
 * task-204: o autopilot precisa de uma `defaultBranch`. A regra e `develop`,
 * senao `main`, senao `master`, olhando as refs locais e as de `origin/*`.
 * Nada de rede: so o que o clone ja conhece.
 */

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function initRepo(dir: string, initialBranch: string): void {
  git(dir, 'init', '-b', initialBranch);
  git(dir, 'config', 'user.email', 'test@taskin.dev');
  git(dir, 'config', 'user.name', 'Taskin Test');
  writeFileSync(join(dir, 'README.md'), '# repo\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-m', 'inicio');
}

describe('detectDefaultBranch', () => {
  let root: string;
  let repo: string;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-default-branch-')));
    repo = join(root, 'repo');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function repoOn(branch: string): void {
    git(root, 'init', '-q', repo);
    initRepo(repo, branch);
  }

  it('escolhe develop quando ela existe', () => {
    repoOn('main');
    git(repo, 'branch', 'develop');

    expect(detectDefaultBranch(repo)).toBe('develop');
  });

  it('prefere develop a main e a master', () => {
    repoOn('master');
    git(repo, 'branch', 'main');
    git(repo, 'branch', 'develop');

    expect(detectDefaultBranch(repo)).toBe('develop');
  });

  it('cai em main quando nao ha develop', () => {
    repoOn('main');

    expect(detectDefaultBranch(repo)).toBe('main');
  });

  it('prefere main a master', () => {
    repoOn('master');
    git(repo, 'branch', 'main');

    expect(detectDefaultBranch(repo)).toBe('main');
  });

  it('cai em master quando nao ha develop nem main', () => {
    repoOn('master');

    expect(detectDefaultBranch(repo)).toBe('master');
  });

  it('nao adivinha: sem develop, main nem master devolve null', () => {
    repoOn('trunk');

    expect(detectDefaultBranch(repo)).toBeNull();
  });

  it('enxerga uma develop que so existe no remoto (clone novo, worktree)', () => {
    const remote = join(root, 'remote.git');
    const origem = join(root, 'origem');
    git(root, 'init', '-q', origem);
    initRepo(origem, 'main');
    git(origem, 'branch', 'develop');
    git(root, 'clone', '--bare', origem, remote);
    git(root, 'clone', remote, repo);
    // O clone abre `main`; `develop` so existe como origin/develop.
    expect(git(repo, 'branch', '--list', 'develop')).toBe('');

    expect(detectDefaultBranch(repo)).toBe('develop');
  });

  it('fora de um repositorio git devolve null', () => {
    expect(detectDefaultBranch(root)).toBeNull();
  });
});
