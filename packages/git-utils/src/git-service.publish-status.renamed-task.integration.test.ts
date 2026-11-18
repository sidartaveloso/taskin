import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitService } from './git-service';

/**
 * Task-254: o commit de status publicado leva a task como a branch a ve. Se o
 * arquivo da task tem outro nome na branch (o `lint --fix` renomeia por
 * `git mv` os nomes longos), a `defaultBranch` fica com um arquivo so da task,
 * o da branch, e nao com os dois.
 */

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function configure(dir: string): void {
  git(dir, 'config', 'user.email', 'test@taskin.dev');
  git(dir, 'config', 'user.name', 'Taskin Test');
}

const OLD_NAME = 'TASKS/task-007-nome-longo.md';
const NEW_NAME = 'TASKS/task-007-nome.md';
const NEIGHBOR = 'TASKS/task-008-vizinha.md';
const ASSETS = 'TASKS/assets/task-007';

function taskContent(status: string): string {
  return `# Task 007\n\n- Status: ${status}\n`;
}

describe('GitService.publishTaskStatusChange - arquivo da task renomeado na branch', () => {
  let root: string;
  let remote: string;
  let main: string;
  let worktree: string;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-publish-rename-')));
    remote = join(root, 'remote.git');
    main = join(root, 'main');
    worktree = join(root, 'branch');

    git(root, 'init', '--bare', '-b', 'develop', remote);
    git(root, 'clone', remote, main);
    configure(main);
    git(main, 'checkout', '-b', 'develop');
    mkdirSync(join(main, 'TASKS'), { recursive: true });
    writeFileSync(join(main, OLD_NAME), taskContent('pending'));
    writeFileSync(join(main, NEIGHBOR), '# Task 008\n\n- Status: pending\n');
    git(main, 'add', '.');
    git(main, 'commit', '-m', 'inicio');
    git(main, 'push', '-u', 'origin', 'develop');

    git(main, 'worktree', 'add', '-b', 'fix/task-007', worktree, 'develop');
    configure(worktree);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const publish = (status: string) => new GitService(worktree).publishTaskStatusChange('007', status, 'develop');

  const publishedPaths = (prefix: string): string[] =>
    git(remote, 'ls-tree', '-r', '--name-only', 'develop', 'TASKS/')
      .split('\n')
      .filter((path) => path.startsWith(prefix));

  const pushToDevelop = (message: string): void => {
    git(main, 'commit', '-m', message);
    git(main, 'push', 'origin', 'develop');
  };

  it('a branch que renomeou o arquivo da task publica um arquivo so, com o nome dela', async () => {
    git(worktree, 'mv', OLD_NAME, NEW_NAME);
    writeFileSync(join(worktree, NEW_NAME), taskContent('in-progress'));

    const result = await publish('in-progress');

    expect(result).toEqual({ published: true });
    expect(publishedPaths('TASKS/task-007-')).toEqual([NEW_NAME]);
    expect(git(remote, 'show', `develop:${NEW_NAME}`)).toContain('Status: in-progress');
  });

  it('o commit publicado so mexe nos dois nomes da task; as outras tasks ficam', async () => {
    git(worktree, 'mv', OLD_NAME, NEW_NAME);
    writeFileSync(join(worktree, NEW_NAME), taskContent('in-progress'));

    await publish('in-progress');

    expect(git(remote, 'show', '--name-only', '--no-renames', '--format=', 'develop').split('\n')).toEqual([
      OLD_NAME,
      NEW_NAME,
    ]);
    expect(publishedPaths('TASKS/task-008-')).toEqual([NEIGHBOR]);
  });

  it('a branch antiga, com o nome velho, publica depois que a defaultBranch recebeu o nome novo', async () => {
    git(main, 'mv', OLD_NAME, NEW_NAME);
    pushToDevelop('renomeia a task-007');
    writeFileSync(join(worktree, OLD_NAME), taskContent('in-progress'));

    const result = await publish('in-progress');

    expect(result).toEqual({ published: true });
    expect(publishedPaths('TASKS/task-007-')).toEqual([OLD_NAME]);
    expect(git(remote, 'show', `develop:${OLD_NAME}`)).toContain('Status: in-progress');
  });

  it('sem nenhum arquivo da task no disco da branch, nada sai da defaultBranch', async () => {
    git(worktree, 'rm', '--quiet', OLD_NAME);
    const before = git(remote, 'rev-parse', 'develop');

    const result = await publish('in-progress');

    expect(result.published).toBe(false);
    expect(git(remote, 'rev-parse', 'develop')).toBe(before);
    expect(publishedPaths('TASKS/task-007-')).toEqual([OLD_NAME]);
  });

  it('os assets da task que a defaultBranch tem e a branch nao continuam publicados', async () => {
    mkdirSync(join(main, ASSETS), { recursive: true });
    writeFileSync(join(main, ASSETS, 'da-develop.png'), 'imagem publicada antes');
    git(main, 'add', ASSETS);
    pushToDevelop('evidencia da task-007');

    git(worktree, 'mv', OLD_NAME, NEW_NAME);
    writeFileSync(join(worktree, NEW_NAME), taskContent('in-progress'));
    mkdirSync(join(worktree, ASSETS), { recursive: true });
    writeFileSync(join(worktree, ASSETS, 'da-branch.png'), 'imagem nova');

    const result = await publish('in-progress');

    expect(result).toEqual({ published: true });
    expect(publishedPaths(`${ASSETS}/`)).toEqual([`${ASSETS}/da-branch.png`, `${ASSETS}/da-develop.png`]);
    expect(publishedPaths('TASKS/task-007-')).toEqual([NEW_NAME]);
  });
});
