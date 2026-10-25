/**
 * `start`, `review` e `finish` numa worktree — task-135.
 *
 * O cenario do Sandcastle: o checkout principal tem `develop` aberta e a rodada
 * roda numa worktree, em outra branch. O desvio antigo (stash, `git checkout
 * develop`, commit, volta) falhava ali em silencio, porque o git nao abre a
 * mesma branch em duas worktrees.
 *
 * Git de verdade, `.taskin.json` de verdade, `GitService` de verdade: o teste
 * olha o efeito no remoto e na worktree, nao as chamadas.
 */

import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { finishTask } from './finish.js';
import { reviewTask } from './review.js';
import { startTask } from './start.js';

const TASK_FILE = 'TASKS/task-001-exemplo.md';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function configure(dir: string): void {
  git(dir, 'config', 'user.email', 'test@taskin.dev');
  git(dir, 'config', 'user.name', 'Taskin Test');
}

describe('mudanca de status numa worktree', () => {
  let root: string;
  let remote: string;
  let main: string;
  let worktree: string;
  let logged: string[];

  function seed(automation: Record<string, unknown>): void {
    git(root, 'init', '--bare', '-b', 'develop', remote);
    git(root, 'clone', remote, main);
    configure(main);
    git(main, 'checkout', '-b', 'develop');
    writeFileSync(
      join(main, '.taskin.json'),
      JSON.stringify({ version: '1.0.0', automation, provider: { type: 'fs', config: {} } }, null, 2),
    );
    mkdirSync(join(main, '.taskin'), { recursive: true });
    writeFileSync(
      join(main, '.taskin', '.taskin-users.json'),
      JSON.stringify({ users: { test: { id: 'test', name: 'Taskin Test', email: 'test@taskin.dev' } } }, null, 2),
    );
    mkdirSync(join(main, 'TASKS'), { recursive: true });
    writeFileSync(join(main, TASK_FILE), '# Task 001 — Exemplo\n\nStatus: pending\nType: feat\nAssignee: test\n');
    git(main, 'add', '.');
    git(main, 'commit', '-m', 'inicio');
    git(main, 'push', '-u', 'origin', 'develop');

    git(main, 'worktree', 'add', '-b', 'sandcastle/rodada-1', worktree, 'develop');
    configure(worktree);
    vi.spyOn(process, 'cwd').mockReturnValue(worktree);
  }

  const remoteTask = (): string => git(remote, 'show', `develop:${TASK_FILE}`);
  const output = (): string => logged.join('\n');

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-status-worktree-')));
    remote = join(root, 'remote.git');
    main = join(root, 'main');
    worktree = join(root, 'rodada');
    logged = [];
    const capture = (...parts: unknown[]) => {
      logged.push(parts.map(String).join(' '));
    };
    vi.spyOn(console, 'log').mockImplementation(capture);
    vi.spyOn(console, 'warn').mockImplementation(capture);
    vi.spyOn(console, 'error').mockImplementation(capture);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });

  describe('autopilot com autoSync e defaultBranch', () => {
    beforeEach(() => {
      seed({ level: 'autopilot', autoSync: true, defaultBranch: 'develop' });
    });

    it('start publica o status na develop do remoto, sem trocar de branch nem fazer stash', async () => {
      const developLocal = git(main, 'rev-parse', 'develop');

      await startTask('001', { sound: false });

      expect(remoteTask()).toContain('Status: in-progress');
      expect(git(worktree, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('sandcastle/rodada-1');
      expect(git(worktree, 'stash', 'list')).toBe('');
      expect(git(main, 'rev-parse', 'develop')).toBe(developLocal);
      expect(output()).toMatch(/origin\/develop/);
    });

    it('o status tambem fica comitado na branch da worktree, so com o arquivo da task', async () => {
      await startTask('001', { sound: false });

      expect(git(worktree, 'log', '-1', '--format=%s')).toContain('task-001');
      expect(git(worktree, 'show', '--name-only', '--format=', 'HEAD')).toBe(TASK_FILE);
      expect(git(worktree, 'status', '--porcelain', '--', 'TASKS')).toBe('');
    });

    it('a worktree continua recebendo a develop depois de publicar', async () => {
      await startTask('001', { sound: false });
      git(worktree, 'fetch', 'origin');

      git(worktree, 'merge', '--no-edit', 'origin/develop');

      expect(git(worktree, 'show', `HEAD:${TASK_FILE}`)).toContain('Status: in-progress');
    });

    it('review publica o in-review', async () => {
      await startTask('001', { sound: false });

      await reviewTask('001', { sound: false, skipChecks: true });

      expect(remoteTask()).toContain('Status: in-review');
    });

    it('finish publica o done e o commit de trabalho nao leva o arquivo da task', async () => {
      await startTask('001', { sound: false });
      writeFileSync(join(worktree, 'trabalho.txt'), 'feito');

      await finishTask('001', { sound: false });

      expect(remoteTask()).toContain('Status: done');
      const workCommit = git(worktree, 'log', '-1', '--format=%H', '--grep', '^feat(task-001)');
      expect(workCommit).not.toBe('');
      expect(git(worktree, 'show', '--name-only', '--format=', workCommit)).not.toContain(TASK_FILE);
    });

    it('falha de publicacao avisa o motivo e mantem o status comitado na worktree', async () => {
      git(worktree, 'remote', 'set-url', 'origin', join(root, 'nao-existe.git'));

      await startTask('001', { sound: false });

      expect(output()).toMatch(/not published/i);
      expect(output()).toMatch(/could not fetch/i);
      expect(git(worktree, 'show', `HEAD:${TASK_FILE}`)).toContain('Status: in-progress');
      expect(git(remote, 'show', `develop:${TASK_FILE}`)).toContain('Status: pending');
    });
  });

  describe('sem autoSync', () => {
    it('comita na branch da worktree e nao empurra nada', async () => {
      seed({ level: 'autopilot', autoSync: false, defaultBranch: 'develop' });
      const remotoAntes = git(remote, 'rev-parse', 'develop');

      await startTask('001', { sound: false });

      expect(git(remote, 'rev-parse', 'develop')).toBe(remotoAntes);
      expect(git(worktree, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('sandcastle/rodada-1');
      expect(git(worktree, 'show', `HEAD:${TASK_FILE}`)).toContain('Status: in-progress');
      expect(git(worktree, 'stash', 'list')).toBe('');
    });
  });
});
