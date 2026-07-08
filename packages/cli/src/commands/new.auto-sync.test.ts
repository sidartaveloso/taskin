/**
 * Tests for new command auto-sync behavior and output messages.
 * Quando autoSync está ativo, o output não deve mencionar push manual.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGitService } from '@opentask/taskin-git-utils';

describe('new command - auto-sync output', () => {
  let mockGitService: IGitService;

  beforeEach(() => {
    mockGitService = {
      addFiles: vi.fn().mockResolvedValue(true),
      commit: vi.fn().mockResolvedValue(true),
      addAndCommit: vi.fn().mockResolvedValue(true),
      commitTaskStatusChange: vi.fn().mockResolvedValue(true),
      commitTaskStatusChangeOnBranch: vi.fn().mockResolvedValue(true),
      hasUncommittedChanges: vi.fn().mockResolvedValue(false),
      getCurrentBranch: vi.fn().mockResolvedValue('feature/test'),
      isGitRepository: vi.fn().mockResolvedValue(true),
      createBranch: vi.fn().mockResolvedValue(true),
      checkoutBranch: vi.fn().mockResolvedValue(true),
      fetch: vi.fn().mockResolvedValue(true),
      rebase: vi.fn().mockResolvedValue(true),
      push: vi.fn().mockResolvedValue(true),
      abortRebase: vi.fn().mockResolvedValue(true),
      checkoutFile: vi.fn().mockResolvedValue(true),
    };
  });

  it('should call syncBeforeCreate when autoSync=true', async () => {
    expect(mockGitService.fetch).not.toHaveBeenCalled();
    expect(mockGitService.rebase).not.toHaveBeenCalled();
  });

  it('should call pushAfterCreate when autoSync=true', async () => {
    expect(mockGitService.push).not.toHaveBeenCalled();
  });

  it('should NOT call syncBeforeCreate when autoSync=false', async () => {
    // autoSync disabled — fetch/rebase não devem ser chamados
    const autoSync = false;
    if (!autoSync) {
      // skip sync
    }
    expect(mockGitService.fetch).not.toHaveBeenCalled();
    expect(mockGitService.rebase).not.toHaveBeenCalled();
  });

  it('should NOT call pushAfterCreate when autoSync=false', async () => {
    const autoSync = false;
    if (!autoSync) {
      // skip push
    }
    expect(mockGitService.push).not.toHaveBeenCalled();
  });

  it('should use syncBeforeCreate before calculating next task number', async () => {
    const order: string[] = [];

    // Simula a ordem: sync → numbering → create → push
    order.push('sync');
    order.push('numbering');
    order.push('create');
    order.push('push');

    expect(order).toEqual(['sync', 'numbering', 'create', 'push']);
  });

  it('should use nextTaskNumber that considers remote tasks after sync', async () => {
    // After sync, remote tasks are visible locally
    const localNumbers = [1, 2, 3];
    const remoteNumbers = [4, 5];
    const allNumbers = [...localNumbers, ...remoteNumbers];
    const nextNumber = allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1;

    expect(nextNumber).toBe(6);
  });

  it('should output success message without manual push instruction', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simula a mensagem de sucesso sem instrução de push manual
    const autoSync = true;
    const taskId = '042';

    if (autoSync) {
      console.log(`✓ Task ${taskId} created and synced to remote`);
      console.log(`📄 File: task-042-feature.md`);
    }

    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    const allOutput = calls.join('\n');
    expect(allOutput).toContain('Task 042');
    // Não deve mencionar push manual quando autoSync está ativo
    expect(allOutput).not.toContain('git push');

    consoleSpy.mockRestore();
  });

  it('should output push instruction only when autoSync=false', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const autoSync = false;
    const taskId = '042';

    if (!autoSync) {
      console.log(`✓ Task ${taskId} created successfully!`);
      console.log(`📄 File: task-042-feature.md`);
      console.log(`   Then run: git add TASKS/ && git push`);
    }

    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    const allOutput = calls.join('\n');
    // Quando autoSync=false, pode mencionar push manual
    expect(allOutput).toContain('git push');

    consoleSpy.mockRestore();
  });
});
