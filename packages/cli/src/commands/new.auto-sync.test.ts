/**
 * Tests for new command auto-sync wiring.
 * Exercita o handler real `createTask` com um GitService mock e um projeto temporário.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createTask } from './new.js';

function createMockGitService(): IGitService {
  return {
    addFiles: vi.fn().mockResolvedValue(true),
    commit: vi.fn().mockResolvedValue(true),
    addAndCommit: vi.fn().mockResolvedValue(true),
    commitTaskStatusChange: vi.fn().mockResolvedValue(true),
    commitTaskStatusChangeOnBranch: vi.fn().mockResolvedValue(true),
    hasUncommittedChanges: vi.fn().mockResolvedValue(false),
    getCurrentBranch: vi.fn().mockResolvedValue('main'),
    isGitRepository: vi.fn().mockResolvedValue(true),
    createBranch: vi.fn().mockResolvedValue(true),
    checkoutBranch: vi.fn().mockResolvedValue(true),
    fetch: vi.fn().mockResolvedValue(true),
    rebase: vi.fn().mockResolvedValue(true),
    push: vi.fn().mockResolvedValue(true),
    abortRebase: vi.fn().mockResolvedValue(true),
    checkoutFile: vi.fn().mockResolvedValue(true),
  };
}

function writeConfig(dir: string, automation: Record<string, unknown>): void {
  writeFileSync(
    join(dir, '.taskin.json'),
    JSON.stringify(
      {
        version: '1.0.0',
        automation: { level: 'assisted', ...automation },
        provider: { type: 'fs', config: {} },
      },
      null,
      2,
    ),
    'utf-8',
  );
}

describe('new command - auto-sync wiring', () => {
  let tempDir: string;
  let cwdSpy: MockInstance;
  let logSpy: MockInstance;
  let warnSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'taskin-new-autosync-'));
    mkdirSync(join(tempDir, 'TASKS'), { recursive: true });
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should sync before numbering and push after creating when autoSync is active', async () => {
    writeConfig(tempDir, { autoSync: true, defaultBranch: 'tasks', originBranch: 'develop' });
    const git = createMockGitService();

    await createTask({ type: 'feat', title: 'Test Feature' }, git);

    // syncBeforeCreate: fetch + rebase on origin/tasks
    expect(git.fetch).toHaveBeenCalled();
    expect(git.rebase).toHaveBeenCalledWith('origin/tasks');
    // pushAfterCreate: push to defaultBranch
    expect(git.push).toHaveBeenCalledWith('tasks');

    // Task file created with the next number
    const taskFile = join(tempDir, 'TASKS', 'task-001-test-feature.md');
    expect(existsSync(taskFile)).toBe(true);
    expect(readFileSync(taskFile, 'utf-8')).toContain('Task 001');
  });

  it('should NOT sync or push when autoSync=false', async () => {
    writeConfig(tempDir, { autoSync: false, defaultBranch: 'tasks' });
    const git = createMockGitService();

    await createTask({ type: 'feat', title: 'Offline Feature' }, git);

    expect(git.fetch).not.toHaveBeenCalled();
    expect(git.rebase).not.toHaveBeenCalled();
    expect(git.push).not.toHaveBeenCalled();

    expect(existsSync(join(tempDir, 'TASKS', 'task-001-offline-feature.md'))).toBe(true);
  });

  it('should warn and skip sync when autoSync=true but no defaultBranch is set', async () => {
    writeConfig(tempDir, { autoSync: true });
    const git = createMockGitService();

    await createTask({ type: 'feat', title: 'No Branch' }, git);

    const allLogs = logSpy.mock.calls.map((call) => call.join(' ')).join(' ');
    expect(allLogs).toContain('defaultBranch');
    expect(git.fetch).not.toHaveBeenCalled();
    expect(git.rebase).not.toHaveBeenCalled();
    expect(git.push).not.toHaveBeenCalled();

    expect(existsSync(join(tempDir, 'TASKS', 'task-001-no-branch.md'))).toBe(true);
  });

  it('should abort creation and NOT create the task when sync fails', async () => {
    writeConfig(tempDir, { autoSync: true, defaultBranch: 'tasks' });
    const git = createMockGitService();
    vi.mocked(git.fetch).mockRejectedValue(new Error('network down'));

    await createTask({ type: 'feat', title: 'Failing Sync' }, git);

    expect(errorSpy).toHaveBeenCalled();
    expect(git.push).not.toHaveBeenCalled();
    expect(existsSync(join(tempDir, 'TASKS', 'task-001-failing-sync.md'))).toBe(false);
  });

  it('should number considering tasks brought by the sync (remote already present locally)', async () => {
    writeConfig(tempDir, { autoSync: true, defaultBranch: 'tasks' });
    // Simula um task remota já presente localmente após o rebase
    writeFileSync(join(tempDir, 'TASKS', 'task-001-remote.md'), '# Task 001 — Remote\n\nStatus: pending\n');
    const git = createMockGitService();

    await createTask({ type: 'feat', title: 'Second Feature' }, git);

    expect(existsSync(join(tempDir, 'TASKS', 'task-002-second-feature.md'))).toBe(true);
  });
});
