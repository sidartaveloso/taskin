import { execSync } from 'child_process';
import { describe, expect, it, vi } from 'vitest';
import { GitService } from './git-service';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Mock git utility functions
vi.mock('./git', () => ({
  branchExists: vi.fn(),
  checkoutBranch: vi.fn(),
  createBranch: vi.fn(),
  getCurrentBranch: vi.fn().mockReturnValue('main'),
  isGitRepository: vi.fn().mockReturnValue(true),
}));

describe('GitService', () => {
  describe('addFiles', () => {
    it('should add files successfully', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      const result = await service.addFiles('*.md');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git add *.md', {
        cwd: '/test/dir',
        stdio: 'ignore',
      });
    });

    it('should return false on error', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Git error');
      });

      const result = await service.addFiles('*.md');

      expect(result).toBe(false);
    });
  });

  describe('commit', () => {
    it('should create commit successfully', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      const result = await service.commit('fix: test commit');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "fix: test commit"',
        {
          cwd: '/test/dir',
          stdio: 'ignore',
        },
      );
    });

    it('should return false on error', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Nothing to commit');
      });

      const result = await service.commit('fix: test');

      expect(result).toBe(false);
    });
  });

  describe('addAndCommit', () => {
    it('should add and commit successfully', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git add *.md', expect.any(Object));
      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "docs: update"',
        expect.any(Object),
      );
    });

    it('should return false if add fails', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('Add failed');
      });

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(false);
    });

    it('should return false if commit fails', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync)
        .mockReturnValueOnce(Buffer.from('')) // add succeeds
        .mockImplementationOnce(() => {
          throw new Error('Commit failed');
        });

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(false);
    });
  });

  describe('commitTaskStatusChange', () => {
    it('should commit task status with correct format', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      const result = await service.commitTaskStatusChange('014', 'in-progress');

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'git add TASKS/task-014-*.md',
        expect.any(Object),
      );
      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "docs(TASKS): task-014 - atualiza status para in-progress [skip-ci]"',
        expect.any(Object),
      );
    });

    it('should handle different statuses', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(Buffer.from(''));

      await service.commitTaskStatusChange('042', 'done');

      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "docs(TASKS): task-042 - atualiza status para done [skip-ci]"',
        expect.any(Object),
      );
    });
  });

  describe('hasUncommittedChanges', () => {
    it('should return true when there are changes', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue(' M file.ts\n A new.ts\n');

      const result = await service.hasUncommittedChanges();

      expect(result).toBe(true);
    });

    it('should return false when clean', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockReturnValue('');

      const result = await service.hasUncommittedChanges();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Not a git repo');
      });

      const result = await service.hasUncommittedChanges();

      expect(result).toBe(false);
    });
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repo', async () => {
      const service = new GitService('/test/dir');

      const result = await service.isGitRepository();

      expect(result).toBe(true);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const service = new GitService('/test/dir');

      const result = await service.getCurrentBranch();

      expect(result).toBe('main');
    });
  });
});
