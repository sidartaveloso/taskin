import { execSync } from 'child_process';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  branchExists,
  checkoutBranch,
  createBranch,
  getCurrentBranch,
  isGitRepository,
} from './git';

// Mock the execSync function
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = execSync as Mock;

describe('Git Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should confirm it is a git repository', () => {
    mockedExecSync.mockReturnValue('true');
    expect(isGitRepository()).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      'git rev-parse --is-inside-work-tree',
      expect.any(Object),
    );
  });

  it('should get the current branch', () => {
    mockedExecSync.mockReturnValue('main');
    expect(getCurrentBranch()).toBe('main');
    expect(execSync).toHaveBeenCalledWith(
      'git branch --show-current',
      expect.any(Object),
    );
  });

  it('should confirm a branch exists', () => {
    mockedExecSync.mockReturnValue('refs/heads/main');
    expect(branchExists('main')).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      'git show-ref --verify --quiet refs/heads/main',
      expect.any(Object),
    );
  });

  it('should confirm a branch does not exist', () => {
    mockedExecSync.mockReturnValue('');
    expect(branchExists('non-existent-branch')).toBe(false);
  });

  it('should create a new branch', () => {
    mockedExecSync.mockReturnValue('main'); // Mock for getCurrentBranch
    createBranch('new-feature');
    expect(execSync).toHaveBeenCalledWith(
      'git checkout -b new-feature main',
      expect.any(Object),
    );
  });

  it('should checkout an existing branch', () => {
    checkoutBranch('existing-feature');
    expect(execSync).toHaveBeenCalledWith(
      'git checkout existing-feature',
      expect.any(Object),
    );
  });
});
