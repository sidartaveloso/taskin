/**
 * The test that vale (task-066): it asserts the *effect on git*, not that a
 * function was called. After the MCP status-change hook runs in an autopilot
 * project, the status commit exists; in a manual project, it does not. A test
 * that only checked the call would pass against the very bug this fixes.
 *
 * Real git, real `.taskin.json`, real `GitService` — the hook reads the
 * project's `automation.level` exactly as `taskin start` does.
 */

import { parseTaskId } from '@opentask/taskin-types';
import { execFileSync, execSync } from 'child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMcpStatusCommitHook } from './index.js';

describe('createMcpStatusCommitHook — effect on git', () => {
  let repo: string;

  function git(cmd: string): string {
    return execSync(`git ${cmd}`, { cwd: repo, encoding: 'utf8', stdio: 'pipe' }).trim();
  }

  function writeConfig(automation: Record<string, unknown>): void {
    writeFileSync(
      join(repo, '.taskin.json'),
      JSON.stringify({ version: '1.0.0', automation, provider: { type: 'fs', config: {} } }, null, 2),
      'utf-8',
    );
  }

  /** Simulate what the provider's updateTask leaves behind: a modified, uncommitted task file. */
  function stageTaskStatus(taskId: string, status: string): void {
    writeFileSync(join(repo, 'TASKS', `task-${taskId}-test.md`), `# Task ${taskId}\n\nStatus: ${status}\n`);
  }

  function commitLog(): string {
    return git('log --pretty=%s');
  }

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'taskin-mcp-hook-'));
    execSync('git init -b main', { cwd: repo, stdio: 'ignore' });
    execSync('git config user.email "test@taskin.dev"', { cwd: repo, stdio: 'ignore' });
    execSync('git config user.name "Taskin Test"', { cwd: repo, stdio: 'ignore' });
    mkdirSync(join(repo, 'TASKS'), { recursive: true });
    writeFileSync(join(repo, 'TASKS', 'task-052-test.md'), '# Task 052\n\nStatus: pending\n');
    execSync('git add .', { cwd: repo, stdio: 'ignore' });
    execSync('git commit -m "seed"', { cwd: repo, stdio: 'ignore' });
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('autopilot: the status commit exists after the hook runs', async () => {
    writeConfig({ level: 'autopilot' });
    stageTaskStatus('052', 'in-progress');

    const hook = createMcpStatusCommitHook({ monorepoRoot: repo, cwd: repo });
    expect(hook).toBeDefined();
    await hook?.({ taskId: parseTaskId('052'), status: 'in-progress' });

    expect(commitLog()).toContain('docs(TASKS): task-052 - atualiza status para in-progress');
  });

  it('manual: no hook is wired, so no status commit is made', async () => {
    writeConfig({ level: 'manual' });
    stageTaskStatus('052', 'in-progress');

    const hook = createMcpStatusCommitHook({ monorepoRoot: repo, cwd: repo });

    expect(hook).toBeUndefined();
    // The working tree still carries the change, but nothing was committed.
    expect(commitLog()).not.toContain('atualiza status');
    expect(git('status --porcelain')).toContain('task-052-test.md');
  });

  it('the auto-committed subject carries the CI-skip tag by default', async () => {
    writeConfig({ level: 'autopilot' });
    stageTaskStatus('052', 'done');

    const hook = createMcpStatusCommitHook({ monorepoRoot: repo, cwd: repo });
    await hook?.({ taskId: parseTaskId('052'), status: 'done' });

    expect(git('log -1 --pretty=%s')).toContain('[skip ci]');
  });
});

/**
 * A porta MCP numa worktree (task-135): com `autoSync` e `defaultBranch`, o
 * status vai para `origin/<defaultBranch>` sem trocar de branch, como no CLI.
 */
describe('createMcpStatusCommitHook — numa worktree, com autoSync', () => {
  let root: string;
  let remote: string;
  let worktree: string;

  const run = (cwd: string, ...args: string[]): string =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-mcp-hook-worktree-')));
    remote = join(root, 'remote.git');
    const main = join(root, 'main');
    worktree = join(root, 'rodada');

    run(root, 'init', '--bare', '-b', 'develop', remote);
    run(root, 'clone', remote, main);
    run(main, 'config', 'user.email', 'test@taskin.dev');
    run(main, 'config', 'user.name', 'Taskin Test');
    run(main, 'checkout', '-b', 'develop');
    writeFileSync(
      join(main, '.taskin.json'),
      JSON.stringify(
        {
          version: '1.0.0',
          automation: { level: 'autopilot', autoSync: true, defaultBranch: 'develop' },
          provider: { type: 'fs', config: {} },
        },
        null,
        2,
      ),
    );
    mkdirSync(join(main, 'TASKS'), { recursive: true });
    writeFileSync(join(main, 'TASKS', 'task-052-test.md'), '# Task 052\n\nStatus: pending\n');
    run(main, 'add', '.');
    run(main, 'commit', '-m', 'seed');
    run(main, 'push', '-u', 'origin', 'develop');
    run(main, 'worktree', 'add', '-b', 'sandcastle/rodada-1', worktree, 'develop');
    run(worktree, 'config', 'user.email', 'test@taskin.dev');
    run(worktree, 'config', 'user.name', 'Taskin Test');
    writeFileSync(join(worktree, 'TASKS', 'task-052-test.md'), '# Task 052\n\nStatus: in-progress\n');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('publica o status na develop do remoto e comita na branch da worktree', async () => {
    const hook = createMcpStatusCommitHook({ monorepoRoot: worktree, cwd: worktree });
    await hook?.({ taskId: parseTaskId('052'), status: 'in-progress' });

    expect(run(remote, 'show', 'develop:TASKS/task-052-test.md')).toContain('Status: in-progress');
    expect(run(worktree, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('sandcastle/rodada-1');
    expect(run(worktree, 'log', '-1', '--format=%s')).toContain('task-052');
  });

  it('falha de publicacao rejeita com o motivo, e o commit local fica', async () => {
    run(worktree, 'remote', 'set-url', 'origin', join(root, 'nao-existe.git'));

    const hook = createMcpStatusCommitHook({ monorepoRoot: worktree, cwd: worktree });

    await expect(hook?.({ taskId: parseTaskId('052'), status: 'in-progress' })).rejects.toThrow(/could not fetch/);
    expect(run(worktree, 'log', '-1', '--format=%s')).toContain('task-052');
  });
});
