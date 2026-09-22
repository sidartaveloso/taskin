/**
 * Tests for finish command auto-sync wiring.
 * Exercita o handler real `finishTask` com um GitService mock e um projeto temporário.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { finishTask } from './finish.js';

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

function writeTaskFile(dir: string, id: string, status: string, title = 'Test Task'): void {
  mkdirSync(join(dir, 'TASKS'), { recursive: true });
  writeFileSync(
    join(dir, 'TASKS', `task-${id}-test-task.md`),
    `# Task ${id} — ${title}\n\nStatus: ${status}\nType: feat\nAssignee: A definir\n`,
    'utf-8',
  );
}

describe('finish command - auto-sync wiring', () => {
  let tempDir: string;
  let cwdSpy: MockInstance;
  let logSpy: MockInstance;
  let warnSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'taskin-finish-autosync-'));
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

  it('should squash the task file to originBranch when marking done with autoSync', async () => {
    writeConfig(tempDir, { autoSync: true, defaultBranch: 'tasks', originBranch: 'develop' });
    writeTaskFile(tempDir, '001', 'pending');
    const git = createMockGitService();

    await finishTask('001', { sound: false }, git);

    // squashTaskFileOnDone flow
    expect(git.checkoutBranch).toHaveBeenCalledWith('develop');
    expect(git.checkoutFile).toHaveBeenCalledWith('tasks', 'TASKS/task-001-*.md');
    expect(git.push).toHaveBeenCalledWith('develop');

    // Status atualizado para done no arquivo
    const content = readFileSync(join(tempDir, 'TASKS', 'task-001-test-task.md'), 'utf-8');
    expect(content).toContain('Status: done');

    // Não deve instruir push manual quando autoSync está ativo
    const allLogs = logSpy.mock.calls.map((call) => call.join(' ')).join(' ');
    expect(allLogs).toContain('Squash commit pushed to develop');
    expect(allLogs).not.toContain('git push');
  });

  it('should NOT squash when originBranch is not configured', async () => {
    writeConfig(tempDir, { autoSync: true, defaultBranch: 'tasks' });
    writeTaskFile(tempDir, '001', 'pending');
    const git = createMockGitService();

    await finishTask('001', { sound: false }, git);

    expect(git.checkoutBranch).not.toHaveBeenCalled();
    expect(git.push).not.toHaveBeenCalled();
  });

  it('should NOT squash when autoSync=false even with originBranch configured', async () => {
    writeConfig(tempDir, { autoSync: false, defaultBranch: 'tasks', originBranch: 'develop' });
    writeTaskFile(tempDir, '001', 'pending');
    const git = createMockGitService();

    await finishTask('001', { sound: false }, git);

    expect(git.checkoutBranch).not.toHaveBeenCalled();
    expect(git.push).not.toHaveBeenCalled();
  });

  it('should show manual push instruction when autoSync is disabled', async () => {
    writeConfig(tempDir, { autoSync: false, defaultBranch: 'tasks' });
    writeTaskFile(tempDir, '001', 'pending');
    const git = createMockGitService();

    await finishTask('001', { sound: false }, git);

    const allLogs = logSpy.mock.calls.map((call) => call.join(' ')).join(' ');
    expect(allLogs).toContain('git push');
  });

  it('should warn when autoSync=true but no defaultBranch is set', async () => {
    writeConfig(tempDir, { autoSync: true });
    writeTaskFile(tempDir, '001', 'pending');
    const git = createMockGitService();

    await finishTask('001', { sound: false }, git);

    const allLogs = logSpy.mock.calls.map((call) => call.join(' ')).join(' ');
    expect(allLogs).toContain('defaultBranch');
  });
});
