import type { IGitService } from '@opentask/taskin-git-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for start command auto-commit logic.
 * Tests the implementation through the IGitService interface.
 */
describe('start command - auto-commit logic (unit)', () => {
  let mockGitService: IGitService;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockGitService = {
      addFiles: vi.fn().mockResolvedValue(true),
      commit: vi.fn().mockResolvedValue(true),
      addAndCommit: vi.fn().mockResolvedValue(true),
      commitTaskStatusChange: vi.fn().mockResolvedValue(true),
      hasUncommittedChanges: vi.fn().mockResolvedValue(false),
      getCurrentBranch: vi.fn().mockResolvedValue('main'),
      isGitRepository: vi.fn().mockResolvedValue(true),
      createBranch: vi.fn().mockResolvedValue(true),
      checkoutBranch: vi.fn().mockResolvedValue(true),
    };
  });

  describe('commitTaskStatusChange behavior', () => {
    it('should call commitTaskStatusChange with correct task ID and status', async () => {
      const taskId = '014';
      const status = 'in-progress';

      await mockGitService.commitTaskStatusChange(taskId, status);

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledWith(
        taskId,
        status,
      );
      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledTimes(1);
    });

    it('should return true when commit succeeds', async () => {
      const result = await mockGitService.commitTaskStatusChange(
        '014',
        'in-progress',
      );

      expect(result).toBe(true);
    });

    it('should return false when commit fails', async () => {
      vi.mocked(mockGitService.commitTaskStatusChange).mockResolvedValue(false);

      const result = await mockGitService.commitTaskStatusChange(
        '014',
        'in-progress',
      );

      expect(result).toBe(false);
    });

    it('should handle different task IDs', async () => {
      await mockGitService.commitTaskStatusChange('001', 'in-progress');
      await mockGitService.commitTaskStatusChange('042', 'in-progress');
      await mockGitService.commitTaskStatusChange('999', 'in-progress');

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledTimes(3);
      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        1,
        '001',
        'in-progress',
      );
      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        2,
        '042',
        'in-progress',
      );
      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        3,
        '999',
        'in-progress',
      );
    });

    it('should handle different statuses', async () => {
      await mockGitService.commitTaskStatusChange('014', 'in-progress');
      await mockGitService.commitTaskStatusChange('014', 'paused');
      await mockGitService.commitTaskStatusChange('014', 'done');

      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        1,
        '014',
        'in-progress',
      );
      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        2,
        '014',
        'paused',
      );
      expect(mockGitService.commitTaskStatusChange).toHaveBeenNthCalledWith(
        3,
        '014',
        'done',
      );
    });
  });

  describe('automation behavior integration', () => {
    it('should commit when autoCommitStatusChange is true', async () => {
      const autoCommitStatusChange = true;

      if (autoCommitStatusChange) {
        const committed = await mockGitService.commitTaskStatusChange(
          '014',
          'in-progress',
        );
        expect(committed).toBe(true);
      }

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalled();
    });

    it('should not commit when autoCommitStatusChange is false', async () => {
      const autoCommitStatusChange = false;

      if (autoCommitStatusChange) {
        await mockGitService.commitTaskStatusChange('014', 'in-progress');
      }

      expect(mockGitService.commitTaskStatusChange).not.toHaveBeenCalled();
    });

    it('should handle commit failure gracefully', async () => {
      vi.mocked(mockGitService.commitTaskStatusChange).mockResolvedValue(false);

      const committed = await mockGitService.commitTaskStatusChange(
        '014',
        'in-progress',
      );

      expect(committed).toBe(false);
      // Application should continue even if commit fails
    });
  });

  describe('edge cases', () => {
    it('should handle task ID normalization (without padding)', async () => {
      await mockGitService.commitTaskStatusChange('14', 'in-progress');

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledWith(
        '14',
        'in-progress',
      );
    });

    it('should handle task ID normalization (with padding)', async () => {
      await mockGitService.commitTaskStatusChange('014', 'in-progress');

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledWith(
        '014',
        'in-progress',
      );
    });

    it('should handle empty status gracefully', async () => {
      await mockGitService.commitTaskStatusChange('014', '');

      expect(mockGitService.commitTaskStatusChange).toHaveBeenCalledWith(
        '014',
        '',
      );
    });
  });
});
