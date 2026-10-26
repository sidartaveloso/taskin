/**
 * Fora do autopilot o status nao e publicado sozinho — task-205.
 *
 * Depois de mudar o status, `start` e `finish` ensinam a publicar so a task,
 * com a dica do provider de arquivos: `git add`/`git commit` restritos aos
 * caminhos da task, nunca `git add .`, que leva a arvore inteira (task-110).
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { finishTask } from './finish.js';
import { startTask } from './start.js';

const TASK_FILE = 'TASKS/task-001-test-task.md';

function createMockGitService(statusCommitted: boolean): IGitService {
  return {
    addFiles: vi.fn().mockResolvedValue(true),
    commit: vi.fn().mockResolvedValue(true),
    commitWork: vi.fn().mockResolvedValue({ status: 'nothing-to-commit' }),
    addAndCommit: vi.fn().mockResolvedValue(true),
    commitTaskStatusChange: vi.fn().mockResolvedValue(statusCommitted),
    commitTaskStatusChangeOnBranch: vi.fn().mockResolvedValue(statusCommitted),
    publishTaskStatusChange: vi.fn().mockResolvedValue({ published: true }),
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

const statusMessage = (status: string): string => `docs(TASKS): task-001 - update status to ${status} [skip ci]`;

const fullHint = (status: string): string =>
  `git add -- ${TASK_FILE} && git commit -m "${statusMessage(status)}" -- ${TASK_FILE} && git push origin HEAD:main`;

describe('dica de publicar so a task depois de mudar o status', () => {
  let tempDir: string;
  let logged: string[];

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'taskin-publish-hint-'));
    mkdirSync(join(tempDir, 'TASKS'), { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.map(String).join(' '));
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  function project(level: string, status: string): void {
    writeFileSync(
      join(tempDir, '.taskin.json'),
      JSON.stringify({
        version: '1.0.0',
        automation: { level, autoSync: false },
        provider: { type: 'fs', config: {} },
      }),
      'utf-8',
    );
    writeFileSync(
      join(tempDir, TASK_FILE),
      `# Task 001 — Test Task\n\nStatus: ${status}\nType: feat\nAssignee: A definir\n`,
      'utf-8',
    );
  }

  const output = (): string => logged.join('\n');

  describe('start', () => {
    it('em manual ensina a comitar e publicar so o arquivo da task', async () => {
      project('manual', 'pending');

      await startTask('001', { sound: false }, createMockGitService(false));

      expect(output()).toContain(fullHint('in-progress'));
      expect(output()).not.toContain('git add TASKS/');
    });

    it('em assisted, com o status ja comitado, ensina so o push', async () => {
      project('assisted', 'pending');

      await startTask('001', { sound: false }, createMockGitService(true));

      expect(output()).toContain('git push origin HEAD:main');
      expect(output()).not.toContain('git add --');
    });

    it('em assisted, se o commit automatico falhou, ensina o comando inteiro', async () => {
      project('assisted', 'pending');

      await startTask('001', { sound: false }, createMockGitService(false));

      expect(output()).toContain(fullHint('in-progress'));
    });

    it('em autopilot nao imprime a dica', async () => {
      project('autopilot', 'pending');

      await startTask('001', { sound: false }, createMockGitService(true));

      expect(output()).not.toContain('git push origin');
      expect(output()).not.toContain('git add --');
    });
  });

  describe('finish', () => {
    it('em manual ensina a publicar so o arquivo da task, no lugar do git add TASKS/', async () => {
      project('manual', 'in-progress');

      await finishTask('001', { sound: false }, createMockGitService(false));

      expect(output()).toContain(fullHint('done'));
      expect(output()).not.toContain('git add TASKS/');
    });

    it('em assisted, com o status ja comitado, ensina so o push', async () => {
      project('assisted', 'in-progress');

      await finishTask('001', { sound: false }, createMockGitService(true));

      expect(output()).toContain('git push origin HEAD:main');
    });

    it('em autopilot nao imprime a dica', async () => {
      project('autopilot', 'in-progress');

      await finishTask('001', { sound: false }, createMockGitService(true));

      expect(output()).not.toContain('git push origin');
      expect(output()).not.toContain('git add --');
    });
  });
});
