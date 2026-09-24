/**
 * O commit de trabalho automatico (`finish` e `pause`) passa pelo
 * `commitWork`, que recusa arquivo sensivel em vez de fazer `git add -A` as
 * cegas (task-110).
 */

import type { IGitService, WorkCommitResult } from '@opentask/taskin-git-utils';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { finishTask } from './finish.js';
import { pauseTask } from './pause.js';

function createMockGitService(): IGitService {
  return {
    addFiles: vi.fn().mockResolvedValue(true),
    commit: vi.fn().mockResolvedValue(true),
    commitWork: vi.fn().mockResolvedValue({ status: 'nothing-to-commit' }),
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

function writeProject(dir: string, level: string, taskStatus: string): void {
  writeFileSync(
    join(dir, '.taskin.json'),
    JSON.stringify({ version: '1.0.0', automation: { level }, provider: { type: 'fs', config: {} } }),
    'utf-8',
  );
  mkdirSync(join(dir, 'TASKS'), { recursive: true });
  writeFileSync(
    join(dir, 'TASKS', 'task-001-test-task.md'),
    `# Task 001 — Test Task\n\nStatus: ${taskStatus}\nType: feat\nAssignee: A definir\n`,
    'utf-8',
  );
}

const blocked: WorkCommitResult = {
  status: 'blocked',
  findings: [
    { path: '.env', reason: 'environment file' },
    { path: 'src/client.ts', reason: 'credential assignment', line: 12 },
  ],
};

describe('commit de trabalho automatico', () => {
  let tempDir: string;
  let spies: MockInstance[];
  const output = () =>
    spies
      .flatMap((spy) => spy.mock.calls)
      .map((call) => call.join(' '))
      .join('\n');

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'taskin-work-commit-'));
    spies = [
      vi.spyOn(process, 'cwd').mockReturnValue(tempDir),
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('finish em autopilot', () => {
    it('comita o trabalho pelo commitWork, com a mensagem da task', async () => {
      writeProject(tempDir, 'autopilot', 'in-progress');
      const git = createMockGitService();
      vi.mocked(git.commitWork).mockResolvedValue({ status: 'committed', files: ['src/a.ts'] });

      await finishTask('001', { sound: false }, git);

      expect(git.commitWork).toHaveBeenCalledWith('feat(task-001): Test Task');
      expect(output()).toContain('Auto-committed completed work');
    });

    it('quando recusa, diz o arquivo e o motivo, e nao afirma que comitou', async () => {
      writeProject(tempDir, 'autopilot', 'in-progress');
      const git = createMockGitService();
      vi.mocked(git.commitWork).mockResolvedValue(blocked);

      await finishTask('001', { sound: false }, git);

      const text = output();
      expect(text).toContain('.env');
      expect(text).toContain('environment file');
      expect(text).toContain('src/client.ts:12');
      expect(text).not.toContain('Auto-committed completed work');
      expect(text).not.toContain('All commits done automatically');
    });

    it('em assisted nao comita trabalho', async () => {
      writeProject(tempDir, 'assisted', 'in-progress');
      const git = createMockGitService();

      await finishTask('001', { sound: false }, git);

      expect(git.commitWork).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    it('comita o WIP pelo commitWork', async () => {
      writeProject(tempDir, 'assisted', 'in-progress');
      const git = createMockGitService();
      vi.mocked(git.commitWork).mockResolvedValue({ status: 'committed', files: ['src/a.ts'] });

      await pauseTask('001', { sound: false }, git);

      expect(git.commitWork).toHaveBeenCalledWith('WIP: task-001 - Test Task');
      expect(output()).toContain('Auto-committed work in progress');
    });

    it('quando recusa, pausa a task mesmo assim e mostra o que ficou de fora', async () => {
      writeProject(tempDir, 'assisted', 'in-progress');
      const git = createMockGitService();
      vi.mocked(git.commitWork).mockResolvedValue(blocked);

      await pauseTask('001', { sound: false }, git);

      const text = output();
      expect(text).toContain('.env');
      expect(text).not.toContain('Auto-committed work in progress');
      expect(text).toContain('Task paused successfully');
    });
  });
});
