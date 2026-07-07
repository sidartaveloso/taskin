import type { IGitService } from '@opentask/taskin-git-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  syncBeforeCreate,
  pushAfterCreate,
  getNextTaskNumberAfterSync,
  squashTaskFileOnDone,
  createTaskWithSync,
} from './auto-sync';
import type { SyncConfig } from './auto-sync';

// ============================================================================
// MockGitService — implements IGitService + new sync methods
// ============================================================================

const createMockGitService = (): IGitService => ({
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
});

// ============================================================================
// Ciclo 3 — syncBeforeCreate
// ============================================================================

describe('syncBeforeCreate', () => {
  let mockGit: ReturnType<typeof createMockGitService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitService();
  });

  it('should call fetch + rebase when autoSync=true and defaultBranch is set', async () => {
    await syncBeforeCreate(mockGit, {
      autoSync: true,
      defaultBranch: 'tasks',
    });

    expect(mockGit.fetch).toHaveBeenCalledOnce();
    expect(mockGit.rebase).toHaveBeenCalledWith('origin/tasks');
  });

  it('should NOT call fetch or rebase when autoSync=false', async () => {
    await syncBeforeCreate(mockGit, {
      autoSync: false,
      defaultBranch: 'tasks',
    });

    expect(mockGit.fetch).not.toHaveBeenCalled();
    expect(mockGit.rebase).not.toHaveBeenCalled();
  });

  it('should NOT call fetch/rebase when defaultBranch is undefined and emit warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await syncBeforeCreate(mockGit, {
      autoSync: true,
      defaultBranch: undefined,
    });

    expect(mockGit.fetch).not.toHaveBeenCalled();
    expect(mockGit.rebase).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should call abortRebase and throw when rebase fails with conflict', async () => {
    mockGit.rebase = vi
      .fn()
      .mockRejectedValue(new Error('Merge conflict in TASKS/task-042.md'));

    await expect(
      syncBeforeCreate(mockGit, { autoSync: true, defaultBranch: 'tasks' }),
    ).rejects.toThrow();

    expect(mockGit.abortRebase).toHaveBeenCalledOnce();
  });

  it('should propagate fetch error without calling rebase', async () => {
    mockGit.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      syncBeforeCreate(mockGit, { autoSync: true, defaultBranch: 'tasks' }),
    ).rejects.toThrow();

    expect(mockGit.rebase).not.toHaveBeenCalled();
    expect(mockGit.abortRebase).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Ciclo 4 — getNextTaskNumberAfterSync
// ============================================================================

describe('getNextTaskNumberAfterSync', () => {
  it('should return max(localCount, remoteCount) + 1 when autoSync=true', async () => {
    const number = await getNextTaskNumberAfterSync({
      autoSync: true,
      localCount: 5,
      remoteCount: 8,
    });
    expect(number).toBe(9);
  });

  it('should return localCount + 1 when autoSync=true and localCount > remoteCount', async () => {
    const number = await getNextTaskNumberAfterSync({
      autoSync: true,
      localCount: 10,
      remoteCount: 3,
    });
    expect(number).toBe(11);
  });

  it('should return localCount + 1 when autoSync=false (ignore remote)', async () => {
    const number = await getNextTaskNumberAfterSync({
      autoSync: false,
      localCount: 5,
      remoteCount: 8,
    });
    expect(number).toBe(6);
  });

  it('should return 1 when there are no tasks', async () => {
    const number = await getNextTaskNumberAfterSync({
      autoSync: true,
      localCount: 0,
      remoteCount: 0,
    });
    expect(number).toBe(1);
  });
});

// ============================================================================
// Ciclo 5 — pushAfterCreate + retry
// ============================================================================

describe('pushAfterCreate', () => {
  let mockGit: ReturnType<typeof createMockGitService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitService();
  });

  it('should addAndCommit task file and push on first attempt', async () => {
    const result = await pushAfterCreate(mockGit, {
      taskId: '042',
      title: 'Implement login',
      defaultBranch: 'tasks',
    });

    expect(result).toBe(true);
    expect(mockGit.addAndCommit).toHaveBeenCalledOnce();
    expect(mockGit.push).toHaveBeenCalledWith('tasks');
  });

  it('should retry on non-fast-forward push failure (2 retries, 3rd succeeds)', async () => {
    mockGit.push = vi
      .fn()
      .mockRejectedValueOnce(new Error('non-fast-forward'))
      .mockRejectedValueOnce(new Error('non-fast-forward'))
      .mockResolvedValueOnce(true);

    const result = await pushAfterCreate(mockGit, {
      taskId: '042',
      title: 'Implement login',
      defaultBranch: 'tasks',
    });

    expect(result).toBe(true);
    expect(mockGit.push).toHaveBeenCalledTimes(3);
    expect(mockGit.fetch).toHaveBeenCalledTimes(2);
    expect(mockGit.rebase).toHaveBeenCalledTimes(2);
    expect(mockGit.addAndCommit).toHaveBeenCalledTimes(3);
  });

  it('should abort after exhausting max retries (3)', async () => {
    mockGit.push = vi.fn().mockRejectedValue(new Error('non-fast-forward'));

    await expect(
      pushAfterCreate(mockGit, {
        taskId: '042',
        title: 'Implement login',
        defaultBranch: 'tasks',
      }),
    ).rejects.toThrow(/retry|exhausted/i);

    expect(mockGit.push).toHaveBeenCalledTimes(3);
    expect(mockGit.addAndCommit).toHaveBeenCalledTimes(3);
  });

  it('should NOT retry when error is not non-fast-forward (auth failure)', async () => {
    mockGit.push = vi.fn().mockRejectedValue(new Error('authentication failed'));

    await expect(
      pushAfterCreate(mockGit, {
        taskId: '042',
        title: 'Implement login',
        defaultBranch: 'tasks',
      }),
    ).rejects.toThrow();

    expect(mockGit.push).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Ciclo 6 — createTaskWithSync (fluxo completo)
// ============================================================================

describe('createTaskWithSync', () => {
  let mockGit: ReturnType<typeof createMockGitService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitService();
  });

  it('should run full sync cycle when autoSync=true', async () => {
    const config: SyncConfig = {
      autoSync: true,
      defaultBranch: 'tasks',
    };

    const result = await createTaskWithSync(mockGit, config, {
      title: 'New feature',
      type: 'feat',
    });

    expect(result).toBeDefined();
    expect(result.taskId).toBeDefined();
    // Order: fetch → rebase → addAndCommit → push
    expect(mockGit.fetch).toHaveBeenCalledOnce();
    expect(mockGit.rebase).toHaveBeenCalledOnce();
    expect(mockGit.addAndCommit).toHaveBeenCalledOnce();
    expect(mockGit.push).toHaveBeenCalledOnce();
  });

  it('should skip sync when autoSync=false', async () => {
    const config: SyncConfig = {
      autoSync: false,
      defaultBranch: 'tasks',
    };

    const result = await createTaskWithSync(mockGit, config, {
      title: 'Local task',
      type: 'fix',
    });

    expect(result).toBeDefined();
    expect(mockGit.fetch).not.toHaveBeenCalled();
    expect(mockGit.rebase).not.toHaveBeenCalled();
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('should retry full cycle on push failure and eventually succeed', async () => {
    mockGit.push = vi
      .fn()
      .mockRejectedValueOnce(new Error('non-fast-forward'))
      .mockResolvedValueOnce(true);

    const config: SyncConfig = {
      autoSync: true,
      defaultBranch: 'tasks',
    };

    const result = await createTaskWithSync(mockGit, config, {
      title: 'Retry task',
      type: 'chore',
    });

    expect(result).toBeDefined();
    expect(mockGit.push).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// Ciclo 7 — squashTaskFileOnDone
// ============================================================================

describe('squashTaskFileOnDone', () => {
  let mockGit: ReturnType<typeof createMockGitService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = createMockGitService();
  });

  it('should extract task file from defaultBranch and commit to originBranch', async () => {
    const result = await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    expect(result).toBe(true);
    expect(mockGit.addFiles).toHaveBeenCalled();
    expect(mockGit.commit).toHaveBeenCalled();
    expect(mockGit.push).toHaveBeenCalledWith('develop');
  });

  it('should include only the task file TASKS/task-042-*.md (not other tasks)', async () => {
    await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    const addCall = mockGit.addFiles.mock.calls[0]?.[0] as string;
    expect(addCall).toContain('task-042');
    expect(addCall).not.toContain('task-043');
  });

  it('should also include TASKS/assets/task-042/ when it exists', async () => {
    await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    const addCall = mockGit.addFiles.mock.calls[0]?.[0] as string;
    expect(addCall).toContain('TASKS/assets/task-042');
  });

  it('should be no-op when originBranch is not configured', async () => {
    const result = await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: undefined,
    });

    expect(result).toBe(false);
    expect(mockGit.addFiles).not.toHaveBeenCalled();
    expect(mockGit.commit).not.toHaveBeenCalled();
    expect(mockGit.push).not.toHaveBeenCalled();
  });

  it('should reuse retry logic when push to originBranch fails', async () => {
    mockGit.push = vi
      .fn()
      .mockRejectedValueOnce(new Error('non-fast-forward'))
      .mockResolvedValueOnce(true);

    const result = await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    expect(result).toBe(true);
    expect(mockGit.push).toHaveBeenCalledTimes(2);
  });

  it('should use descriptive commit message referencing the task', async () => {
    await squashTaskFileOnDone(mockGit, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    const commitMessage = mockGit.commit.mock.calls[0]?.[0] as string;
    expect(commitMessage).toContain('task-042');
    expect(commitMessage).toContain('done');
  });
});
