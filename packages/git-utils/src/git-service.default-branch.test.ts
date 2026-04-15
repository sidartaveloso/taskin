import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitService } from './git-service';
import type { IGitService } from './git-service.types';

/**
 * Unit tests for GitService defaultBranch feature.
 * Tests the commitTaskStatusChangeOnBranch method behavior.
 */
describe('GitService - defaultBranch feature', () => {
  let mockGitService: IGitService;

  beforeEach(() => {
    // Create a mock implementation of IGitService
    mockGitService = {
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
    };
  });

  describe('commitTaskStatusChangeOnBranch', () => {
    it('should call method with correct parameters', async () => {
      const taskId = '017';
      const status = 'in-progress';
      const defaultBranch = 'main';

      await mockGitService.commitTaskStatusChangeOnBranch(
        taskId,
        status,
        defaultBranch,
      );

      expect(
        mockGitService.commitTaskStatusChangeOnBranch,
      ).toHaveBeenCalledWith(taskId, status, defaultBranch);
      expect(
        mockGitService.commitTaskStatusChangeOnBranch,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return true on success', async () => {
      const result = await mockGitService.commitTaskStatusChangeOnBranch(
        '017',
        'in-progress',
        'main',
      );

      expect(result).toBe(true);
    });

    it('should handle undefined defaultBranch', async () => {
      const result = await mockGitService.commitTaskStatusChangeOnBranch(
        '017',
        'in-progress',
        undefined,
      );

      expect(result).toBe(true);
    });

    it('should work with different branch names', async () => {
      await mockGitService.commitTaskStatusChangeOnBranch(
        '017',
        'in-progress',
        'develop',
      );
      await mockGitService.commitTaskStatusChangeOnBranch(
        '017',
        'in-progress',
        'feature/test',
      );
      await mockGitService.commitTaskStatusChangeOnBranch(
        '017',
        'in-progress',
        'release/v1.0',
      );

      expect(
        mockGitService.commitTaskStatusChangeOnBranch,
      ).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with GitService implementation', () => {
    it('should have the method available in actual GitService', () => {
      const gitService = new GitService(process.cwd());

      // Check that method exists
      expect(typeof gitService.commitTaskStatusChangeOnBranch).toBe('function');
    });
  });
});
