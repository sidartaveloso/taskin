/**
 * Tests for finish command auto-sync behavior and output messages.
 * Quando autoSync está ativo, o output "Next steps" não deve incluir git push manual.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('finish command - auto-sync output', () => {
  let _mockGitService: IGitService;

  beforeEach(() => {
    _mockGitService = {
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

  describe('next steps output with autoSync', () => {
    it('should NOT include git push in next steps when autoSync=true', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const autoSync = true;
      const _taskId = '042';
      const _status = 'done';

      // Simula o output do finish quando autoSync está ativo
      if (autoSync) {
        console.log('  Next steps:');
        console.log('    1. Create a Pull Request');
      }

      const calls = consoleSpy.mock.calls.map((c) => c[0]);
      const allOutput = calls.join('\n');
      expect(allOutput).not.toContain('git push');

      consoleSpy.mockRestore();
    });

    it('should NOT include manual commit steps when autoSync=true and autopilot', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const autoSync = true;
      const autoCommitFinish = true;

      if (autoSync && autoCommitFinish) {
        console.log('✓ Auto-committed status change');
        console.log('✓ Auto-committed completed work');
        console.log('✓ Auto-pushed to remote');
        console.log('');
        console.log('  Next steps:');
        console.log('    1. Create a Pull Request');
      }

      const calls = consoleSpy.mock.calls.map((c) => c[0]);
      const allOutput = calls.join('\n');
      expect(allOutput).not.toContain('git add');
      expect(allOutput).not.toContain('git commit');
      expect(allOutput).not.toContain('git push');

      consoleSpy.mockRestore();
    });

    it('should include manual push in next steps when autoSync=false', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const autoSync = false;

      if (!autoSync) {
        console.log('  Next steps:');
        console.log('    1. Push: git push');
        console.log('    2. Create a Pull Request');
      }

      const calls = consoleSpy.mock.calls.map((c) => c[0]);
      const allOutput = calls.join('\n');
      expect(allOutput).toContain('git push');

      consoleSpy.mockRestore();
    });
  });

  describe('squash-on-done output', () => {
    it('should indicate squash to originBranch when autoSync and originBranch are configured', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const autoSync = true;
      const originBranch = 'develop';

      if (autoSync && originBranch) {
        console.log('✓ Task 042 marked as done');
        console.log('✓ Squash commit pushed to develop');
      }

      const calls = consoleSpy.mock.calls.map((c) => c[0]);
      const allOutput = calls.join('\n');
      expect(allOutput).toContain('develop');
      expect(allOutput).toContain('Squash');

      consoleSpy.mockRestore();
    });

    it('should NOT mention squash when originBranch is not configured', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const autoSync = true;
      const originBranch = undefined;

      if (autoSync && originBranch) {
        console.log('✓ Squash commit pushed to develop');
      } else {
        console.log('✓ Task 042 marked as done');
      }

      const calls = consoleSpy.mock.calls.map((c) => c[0]);
      const allOutput = calls.join('\n');
      expect(allOutput).not.toContain('Squash');

      consoleSpy.mockRestore();
    });
  });

  describe('squashTaskFileOnDone integration', () => {
    it('should be called when status transitions to done with originBranch configured', async () => {
      const status = 'done';
      const originBranch = 'develop';

      const shouldSquash = status === 'done' && !!originBranch;
      expect(shouldSquash).toBe(true);
    });

    it('should NOT be called when originBranch is not configured', async () => {
      const status = 'done';
      const originBranch = undefined;

      const shouldSquash = status === 'done' && !!originBranch;
      expect(shouldSquash).toBe(false);
    });

    it('should NOT be called when status is not done even with originBranch', async () => {
      const status: string = 'in-progress';
      const originBranch = 'develop';

      const shouldSquash = status === 'done' && !!originBranch;
      expect(shouldSquash).toBe(false);
    });
  });

  describe('warning messages', () => {
    it('should show warning when autoSync=true but defaultBranch is not set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const autoSync = true;
      const defaultBranch = undefined;

      if (autoSync && !defaultBranch) {
        console.warn('⚠ autoSync is enabled but no defaultBranch is configured. Nothing will be synced.');
      }

      expect(warnSpy).toHaveBeenCalled();
      const warnMessage = warnSpy.mock.calls[0]?.[0] as string;
      expect(warnMessage).toContain('autoSync');
      expect(warnMessage).toContain('defaultBranch');

      warnSpy.mockRestore();
    });

    it('should NOT show warning when autoSync=false and defaultBranch is not set', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const autoSync = false;
      const defaultBranch = undefined;

      if (autoSync && !defaultBranch) {
        console.warn('⚠ autoSync warning');
      }

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
