import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listLocalTaskSources } from './local-task-sources';

/**
 * Contrato da task-251: o `list` e o `new` enxergam as tasks que estao em
 * outras worktrees locais e nas refs locais da branch padrao, sem rede quando
 * o autoSync esta desligado.
 *
 * O cenario e o de 14/11/2026: a task-048 foi criada na worktree da develop e
 * nao aparecia na worktree da feature.
 */

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function configure(dir: string): void {
  git(dir, 'config', 'user.email', 'test@taskin.dev');
  git(dir, 'config', 'user.name', 'Taskin Test');
}

function task(id: string, status: string): string {
  return `# Task ${id}\n\n- Status: ${status}\n`;
}

describe('listLocalTaskSources - integration', () => {
  let root: string;
  let remote: string;
  let main: string;
  let feature: string;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-sources-')));
    remote = join(root, 'remote.git');
    main = join(root, 'main');
    feature = join(root, 'feature');

    git(root, 'init', '--bare', '-b', 'develop', remote);
    git(root, 'clone', remote, main);
    configure(main);
    git(main, 'checkout', '-b', 'develop');
    mkdirSync(join(main, 'TASKS'), { recursive: true });
    writeFileSync(join(main, 'TASKS', 'task-001-um.md'), task('001', 'done'));
    git(main, 'add', '.');
    git(main, 'commit', '-m', 'inicio');
    git(main, 'push', '-u', 'origin', 'develop');

    git(main, 'worktree', 'add', '-b', 'feat/x', feature, 'develop');
    configure(feature);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const names = (files: { fileName: string }[]): string[] => [...new Set(files.map((f) => f.fileName))].sort();

  it('le uma task nao commitada de outra worktree', async () => {
    writeFileSync(join(main, 'TASKS', 'task-002-nova.md'), task('002', 'pending'));

    const { files } = await listLocalTaskSources({ cwd: feature, tasksDirectory: join(feature, 'TASKS') });

    const nova = files.find((f) => f.fileName === 'task-002-nova.md');
    expect(nova?.content).toContain('Status: pending');
    expect(nova?.source).toEqual({ kind: 'worktree', path: main, branch: 'develop' });
  });

  it('nao devolve a propria worktree', async () => {
    writeFileSync(join(feature, 'TASKS', 'task-003-local.md'), task('003', 'pending'));

    const { files } = await listLocalTaskSources({ cwd: feature, tasksDirectory: join(feature, 'TASKS') });

    expect(names(files)).not.toContain('task-003-local.md');
    expect(files.some((f) => f.source.kind === 'worktree' && f.source.path === feature)).toBe(false);
  });

  it('le a branch padrao local e origin/<branch> com ls-tree, sem worktree aberta nela', async () => {
    writeFileSync(join(main, 'TASKS', 'task-004-commitada.md'), task('004', 'in-progress'));
    git(main, 'add', '.');
    git(main, 'commit', '-m', 'task 004');
    git(main, 'push');
    git(main, 'checkout', '-q', '-b', 'outra');

    const { files } = await listLocalTaskSources({
      cwd: feature,
      tasksDirectory: join(feature, 'TASKS'),
      defaultBranch: 'develop',
    });

    const daRef = files.filter((f) => f.fileName === 'task-004-commitada.md' && f.source.kind === 'ref');
    expect(daRef.map((f) => (f.source.kind === 'ref' ? f.source.ref : ''))).toEqual(['develop', 'origin/develop']);
    expect(daRef[0]?.content).toContain('Status: in-progress');
  });

  it('sem fetch, nao ve o que so existe no remoto', async () => {
    const outro = join(root, 'outro');
    git(root, 'clone', '-q', remote, outro);
    configure(outro);
    writeFileSync(join(outro, 'TASKS', 'task-005-remota.md'), task('005', 'pending'));
    git(outro, 'add', '.');
    git(outro, 'commit', '-m', 'task 005');
    git(outro, 'push', '-q');

    const semRede = await listLocalTaskSources({
      cwd: feature,
      tasksDirectory: join(feature, 'TASKS'),
      defaultBranch: 'develop',
    });
    expect(names(semRede.files)).not.toContain('task-005-remota.md');

    const comFetch = await listLocalTaskSources({
      cwd: feature,
      tasksDirectory: join(feature, 'TASKS'),
      defaultBranch: 'develop',
      fetch: true,
    });
    expect(
      comFetch.files.some(
        (f) => f.fileName === 'task-005-remota.md' && f.source.kind === 'ref' && f.source.ref === 'origin/develop',
      ),
    ).toBe(true);
  });

  it('fetch que falha avisa e segue com o que ha localmente', async () => {
    git(feature, 'remote', 'set-url', 'origin', join(root, 'nao-existe.git'));

    const { files, warnings } = await listLocalTaskSources({
      cwd: feature,
      tasksDirectory: join(feature, 'TASKS'),
      defaultBranch: 'develop',
      fetch: true,
    });

    expect(warnings.join('\n')).toMatch(/fetch/i);
    expect(names(files)).toContain('task-001-um.md');
  });

  it('a ordem de precedencia poe a worktree da branch padrao antes das refs e das outras worktrees', async () => {
    const terceira = join(root, 'terceira');
    git(main, 'worktree', 'add', '-q', '-b', 'feat/y', terceira, 'develop');

    const { files } = await listLocalTaskSources({
      cwd: feature,
      tasksDirectory: join(feature, 'TASKS'),
      defaultBranch: 'develop',
    });

    const fontes = files
      .filter((f) => f.fileName === 'task-001-um.md')
      .map((f) => (f.source.kind === 'ref' ? f.source.ref : f.source.branch));
    expect(fontes).toEqual(['develop', 'develop', 'origin/develop', 'feat/y']);
  });

  it('ignora arquivos que nao sao task e worktree cuja pasta sumiu', async () => {
    writeFileSync(join(main, 'TASKS', 'README.md'), '# leia');
    const sumida = join(root, 'sumida');
    git(main, 'worktree', 'add', '-q', '-b', 'feat/z', sumida, 'develop');
    rmSync(sumida, { recursive: true, force: true });

    const { files } = await listLocalTaskSources({ cwd: feature, tasksDirectory: join(feature, 'TASKS') });

    expect(names(files)).toEqual(['task-001-um.md']);
  });

  it('fora de um repositorio git devolve vazio, sem erro', async () => {
    const solto = join(root, 'solto');
    mkdirSync(join(solto, 'TASKS'), { recursive: true });

    const result = await listLocalTaskSources({
      cwd: solto,
      tasksDirectory: join(solto, 'TASKS'),
      defaultBranch: 'develop',
    });

    expect(result).toEqual({ files: [], warnings: [] });
  });
});
