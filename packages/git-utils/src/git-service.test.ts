import { execFileSync, execSync } from 'child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitService } from './git-service';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

const gitOptions = { cwd: '/test/dir', encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 };

/** Os argumentos de cada chamada ao git feita sem shell. */
const gitCalls = () => vi.mocked(execFileSync).mock.calls.map(([, args]) => args);

// Mock git utility functions
vi.mock('./git', () => ({
  branchExists: vi.fn(),
  checkoutBranch: vi.fn(),
  createBranch: vi.fn(),
  getCurrentBranch: vi.fn().mockReturnValue('main'),
  isGitRepository: vi.fn().mockReturnValue(true),
}));

describe('GitService', () => {
  beforeEach(() => {
    // So os do git: os mocks de './git' carregam valores de retorno fixos.
    vi.mocked(execSync).mockReset();
    vi.mocked(execFileSync).mockReset();
  });

  describe('addFiles', () => {
    it('should add files successfully, without a shell', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      const result = await service.addFiles('*.md');

      expect(result).toBe(true);
      expect(execFileSync).toHaveBeenCalledWith('git', ['add', '--', '*.md'], gitOptions);
    });

    it('should return false on error', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockImplementation(() => {
        throw new Error('Git error');
      });

      const result = await service.addFiles('*.md');

      expect(result).toBe(false);
    });
  });

  describe('commit', () => {
    it('should create commit successfully', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      const result = await service.commit('fix: test commit');

      expect(result).toBe(true);
      expect(execFileSync).toHaveBeenCalledWith('git', ['commit', '-m', 'fix: test commit'], gitOptions);
    });

    it('should commit only the given paths when there are any', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      await service.commit('fix: test commit', ['a.md', 'b.md']);

      expect(gitCalls()).toEqual([['commit', '-m', 'fix: test commit', '--', 'a.md', 'b.md']]);
    });

    it('should return false on error', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockImplementation(() => {
        throw new Error('Nothing to commit');
      });

      const result = await service.commit('fix: test');

      expect(result).toBe(false);
    });
  });

  describe('addAndCommit', () => {
    it('should add and commit only what it added', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(true);
      expect(gitCalls()).toEqual([
        ['add', '--', '*.md'],
        ['commit', '-m', 'docs: update', '--', '*.md'],
      ]);
    });

    it('should return false if add fails', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw new Error('Add failed');
      });

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(false);
    });

    it('should return false if commit fails', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync)
        .mockReturnValueOnce('') // add succeeds
        .mockImplementationOnce(() => {
          throw new Error('Commit failed');
        });

      const result = await service.addAndCommit('*.md', 'docs: update');

      expect(result).toBe(false);
    });
  });

  describe('commitTaskStatusChange', () => {
    const commitMessages = () =>
      gitCalls()
        .filter((args) => args?.[0] === 'commit')
        .map((args) => args?.[2]);

    it('should commit only the task file, with the standard message', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      const result = await service.commitTaskStatusChange('014', 'in-progress');

      expect(result).toBe(true);
      expect(gitCalls()).toEqual([
        ['add', '--', 'TASKS/task-014-*.md'],
        [
          'commit',
          '-m',
          'docs(TASKS): task-014 - atualiza status para in-progress [skip ci]',
          '--',
          'TASKS/task-014-*.md',
        ],
      ]);
    });

    it('should handle different statuses', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      await service.commitTaskStatusChange('042', 'done');

      expect(commitMessages()).toEqual(['docs(TASKS): task-042 - atualiza status para done [skip ci]']);
    });

    it('should never emit the hyphenated tag, which no platform recognizes', async () => {
      const service = new GitService('/test/dir');
      vi.mocked(execFileSync).mockReturnValue('');

      await service.commitTaskStatusChange('014', 'done');

      expect(commitMessages().some((message) => message?.includes('[skip-ci]'))).toBe(false);
    });

    it('should use the tag configured on the service', async () => {
      const service = new GitService('/test/dir', { ciSkipTag: '[ci skip]' });
      vi.mocked(execFileSync).mockReturnValue('');

      await service.commitTaskStatusChange('014', 'done');

      expect(commitMessages()).toEqual(['docs(TASKS): task-014 - atualiza status para done [ci skip]']);
    });

    it('should append no tag when the service is configured with an empty one', async () => {
      const service = new GitService('/test/dir', { ciSkipTag: '' });
      vi.mocked(execFileSync).mockReturnValue('');

      await service.commitTaskStatusChange('014', 'done');

      expect(commitMessages()).toEqual(['docs(TASKS): task-014 - atualiza status para done']);
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
      vi.mocked(execSync).mockReturnValue('main\n');

      const result = await service.getCurrentBranch();

      expect(result).toBe('main');
      expect(execSync).toHaveBeenCalledWith('git branch --show-current', {
        cwd: '/test/dir',
        encoding: 'utf8',
        stdio: 'pipe',
      });
    });
  });
});
