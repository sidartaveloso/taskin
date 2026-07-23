import { execSync } from 'child_process';
import { describe, expect, it, vi } from 'vitest';
import { GitService } from './git-service.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('GitService - fetch', () => {
  it('should fetch from default remote (origin)', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await service.fetch();

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git fetch origin', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });

  it('should return false on fetch failure', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Failed to fetch');
    });

    const result = await service.fetch();

    expect(result).toBe(false);
  });

  it('should accept custom remote name', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    await service.fetch('upstream');

    expect(execSync).toHaveBeenCalledWith('git fetch upstream', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });
});

describe('GitService - rebase', () => {
  it('should rebase on specified branch', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await service.rebase('origin/tasks');

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git rebase origin/tasks', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });

  it('should return false on rebase conflict', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Merge conflict');
    });

    const result = await service.rebase('origin/tasks');

    expect(result).toBe(false);
  });
});

describe('GitService - push', () => {
  it('should push to remote tracking branch', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await service.push('tasks');

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git push origin tasks', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });

  it('should return error message on non-fast-forward rejection', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockImplementation(() => {
      const error = new Error('! [rejected] tasks -> tasks (non-fast-forward)') as NodeJS.ErrnoException & {
        stderr: string;
      };
      error.stderr = '! [rejected] tasks -> tasks (non-fast-forward)';
      throw error;
    });

    const result = await service.push('tasks');

    expect(result).toBe(false);
  });

  it('should accept custom remote name', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    await service.push('tasks', 'upstream');

    expect(execSync).toHaveBeenCalledWith('git push upstream tasks', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });
});

describe('GitService - abortRebase', () => {
  it('should abort current rebase', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await service.abortRebase();

    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith('git rebase --abort', {
      cwd: '/test',
      stdio: 'ignore',
    });
  });

  it('should return false if no rebase in progress', async () => {
    const service = new GitService('/test');
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('No rebase in progress');
    });

    const result = await service.abortRebase();

    expect(result).toBe(false);
  });
});
