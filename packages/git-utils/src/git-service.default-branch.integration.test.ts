import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitService } from './git-service';

/**
 * Integration tests for GitService defaultBranch feature.
 * Tests real git operations with temporary repositories.
 */
describe('GitService.commitTaskStatusChangeOnBranch - Integration', () => {
  let testDir: string;
  let gitService: GitService;

  beforeEach(() => {
    // Create unique temporary directory
    testDir = mkdtempSync(join(tmpdir(), 'taskin-git-test-'));
    gitService = new GitService(testDir);

    // Initialize git repository
    execSync('git init', { cwd: testDir, stdio: 'ignore' });
    execSync('git config user.email "test@taskin.dev"', {
      cwd: testDir,
      stdio: 'ignore',
    });
    execSync('git config user.name "Taskin Test"', {
      cwd: testDir,
      stdio: 'ignore',
    });

    // Create TASKS directory
    mkdirSync(join(testDir, 'TASKS'), { recursive: true });

    // Create initial commit on main
    writeFileSync(join(testDir, 'README.md'), '# Test Repo');
    execSync('git add .', { cwd: testDir, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', {
      cwd: testDir,
      stdio: 'ignore',
    });
  });

  afterEach(() => {
    // Cleanup temporary repository
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      // Log but don't fail if cleanup fails
      console.warn(`Failed to cleanup ${testDir}:`, error);
    }
  });

  // Helper functions
  function getCurrentBranch(): string {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
  }

  function getLastCommitMessage(branch?: string): string {
    const cmd = branch
      ? `git log ${branch} -1 --pretty=%B`
      : 'git log -1 --pretty=%B';
    return execSync(cmd, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
  }

  function createBranchWithCommit(
    branchName: string,
    baseBranch: string = 'main',
  ): void {
    execSync(`git checkout ${baseBranch}`, { cwd: testDir, stdio: 'ignore' });
    execSync(`git checkout -b ${branchName}`, {
      cwd: testDir,
      stdio: 'ignore',
    });
    // Use safe filename (replace slashes with dashes)
    const safeFilename = branchName.replace(/\//g, '-');
    writeFileSync(join(testDir, `${safeFilename}.txt`), `Branch ${branchName}`);
    execSync('git add .', { cwd: testDir, stdio: 'ignore' });
    execSync(`git commit -m "Create ${branchName}"`, {
      cwd: testDir,
      stdio: 'ignore',
    });
  }

  function addLocalChanges(filename: string, content: string): void {
    writeFileSync(join(testDir, filename), content);
  }

  function fileContentMatches(
    filename: string,
    expectedContent: string,
  ): boolean {
    if (!existsSync(join(testDir, filename))) return false;
    const content = readFileSync(join(testDir, filename), 'utf-8');
    return content === expectedContent;
  }

  function createTaskFile(taskId: string, status: string): void {
    const taskFile = join(testDir, 'TASKS', `task-${taskId}-test.md`);
    const content = `# Task ${taskId}\n\nStatus: ${status}\n`;
    writeFileSync(taskFile, content);
    execSync('git add .', { cwd: testDir, stdio: 'ignore' });
    execSync(`git commit -m "Create task ${taskId}"`, {
      cwd: testDir,
      stdio: 'ignore',
    });
  }

  function updateTaskStatus(taskId: string, newStatus: string): void {
    const taskFile = join(testDir, 'TASKS', `task-${taskId}-test.md`);
    const content = `# Task ${taskId}\n\nStatus: ${newStatus}\n`;
    writeFileSync(taskFile, content);
  }

  /**
   * Scenario 1: Happy Path - Commit on target branch and return
   */
  it('should commit on target branch and return to original branch', async () => {
    // Setup: Create task on main
    createTaskFile('001', 'todo');

    // Create feature branch (inherits task from main)
    createBranchWithCommit('feature/test');

    // Update task on feature branch
    updateTaskStatus('001', 'in-progress');

    // Action: Commit on main branch
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '001',
      'in-progress',
      'main',
    );

    // Assert: Success
    expect(result).toBe(true);

    // Assert: Back to feature branch
    const currentBranch = getCurrentBranch();
    expect(currentBranch).toBe('feature/test');

    // Assert: Commit exists on main
    const mainCommitMsg = getLastCommitMessage('main');
    expect(mainCommitMsg).toContain('task-001');
    expect(mainCommitMsg).toContain('in-progress');
  });

  /**
   * Scenario 2: Preserve local changes with stash/unstash
   */
  it('should preserve local changes when committing on another branch', async () => {
    // Setup: Create task on main
    createTaskFile('002', 'todo');

    // Create feature branch with local changes
    createBranchWithCommit('feature/preserve-changes');
    const localContent = 'Important local changes';
    addLocalChanges('local-work.txt', localContent);
    updateTaskStatus('002', 'in-progress');

    // Action: Commit on main
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '002',
      'in-progress',
      'main',
    );

    // Assert: Success
    expect(result).toBe(true);

    // Assert: Back to feature branch
    expect(getCurrentBranch()).toBe('feature/preserve-changes');

    // Assert: Local changes preserved
    expect(fileContentMatches('local-work.txt', localContent)).toBe(true);

    // Assert: Commit on main
    const mainCommitMsg = getLastCommitMessage('main');
    expect(mainCommitMsg).toContain('task-002');
  });

  /**
   * Scenario 3: Rollback on error during commit
   */
  it('should rollback to original branch on commit failure', async () => {
    // Setup: Create feature branch
    createBranchWithCommit('feature/rollback-test');
    createTaskFile('003', 'todo');

    // Switch to feature
    execSync('git checkout feature/rollback-test', {
      cwd: testDir,
      stdio: 'ignore',
    });
    addLocalChanges('local.txt', 'local data');

    // Action: Try to commit non-existent task (should fail)
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '999', // Task doesn't exist
      'done',
      'main',
    );

    // Assert: Failed
    expect(result).toBe(false);

    // Assert: Still on feature branch (rollback worked)
    expect(getCurrentBranch()).toBe('feature/rollback-test');

    // Assert: Local changes should be restored
    expect(existsSync(join(testDir, 'local.txt'))).toBe(true);
  });

  /**
   * Scenario 4: Handle non-existent target branch
   */
  it('should return false when target branch does not exist', async () => {
    // Setup: Create feature branch with task
    createBranchWithCommit('feature/test-branch');
    createTaskFile('004', 'todo');
    execSync('git checkout feature/test-branch', {
      cwd: testDir,
      stdio: 'ignore',
    });
    updateTaskStatus('004', 'in-progress');

    // Action: Try to commit on non-existent branch
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '004',
      'in-progress',
      'non-existent-branch',
    );

    // Assert: Failed
    expect(result).toBe(false);

    // Assert: Still on original branch
    expect(getCurrentBranch()).toBe('feature/test-branch');
  });

  /**
   * Scenario 5: Already on target branch - no stash needed
   */
  it('should commit normally when already on target branch', async () => {
    // Setup: Stay on main, create task
    createTaskFile('005', 'todo');
    updateTaskStatus('005', 'in-progress');

    // Action: Commit on main while on main
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '005',
      'in-progress',
      'main',
    );

    // Assert: Success
    expect(result).toBe(true);

    // Assert: Still on main
    expect(getCurrentBranch()).toBe('main');

    // Assert: Commit created
    const lastCommit = getLastCommitMessage();
    expect(lastCommit).toContain('task-005');
    expect(lastCommit).toContain('in-progress');
  });

  /**
   * Scenario 6: No defaultBranch specified - use normal commit
   */
  it('should use normal commit when no defaultBranch specified', async () => {
    // Setup: Create feature branch with task
    createBranchWithCommit('feature/normal-commit');
    createTaskFile('006', 'todo');
    execSync('git checkout feature/normal-commit', {
      cwd: testDir,
      stdio: 'ignore',
    });
    updateTaskStatus('006', 'in-progress');

    // Action: Commit without defaultBranch
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '006',
      'in-progress',
      undefined, // No defaultBranch
    );

    // Assert: Success
    expect(result).toBe(true);

    // Assert: Still on feature branch
    expect(getCurrentBranch()).toBe('feature/normal-commit');

    // Assert: Commit created on current branch
    const lastCommit = getLastCommitMessage();
    expect(lastCommit).toContain('task-006');
    expect(lastCommit).toContain('in-progress');
  });

  /**
   * Scenario 7: Multiple stash/unstash operations don't interfere
   */
  it('should handle multiple sequential commits with stash operations', async () => {
    // Setup: Create tasks on main
    createTaskFile('007', 'todo');
    createTaskFile('008', 'todo');

    // Create feature branch with local changes
    createBranchWithCommit('feature/multi-commit');
    addLocalChanges('work1.txt', 'work 1');

    // First commit
    updateTaskStatus('007', 'in-progress');
    const result1 = await gitService.commitTaskStatusChangeOnBranch(
      '007',
      'in-progress',
      'main',
    );

    expect(result1).toBe(true);
    expect(getCurrentBranch()).toBe('feature/multi-commit');
    expect(fileContentMatches('work1.txt', 'work 1')).toBe(true);

    // Second commit with more local changes
    addLocalChanges('work2.txt', 'work 2');
    updateTaskStatus('008', 'in-progress');
    const result2 = await gitService.commitTaskStatusChangeOnBranch(
      '008',
      'in-progress',
      'main',
    );

    expect(result2).toBe(true);
    expect(getCurrentBranch()).toBe('feature/multi-commit');
    expect(fileContentMatches('work1.txt', 'work 1')).toBe(true);
    expect(fileContentMatches('work2.txt', 'work 2')).toBe(true);

    // Verify both commits on main
    execSync('git stash', { cwd: testDir, stdio: 'ignore' });
    execSync('git checkout main', { cwd: testDir, stdio: 'ignore' });
    const log = execSync('git log --oneline', {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    expect(log).toContain('task-007');
    expect(log).toContain('task-008');
  });

  /**
   * Scenario 8: Empty repository handling
   */
  it('should handle commits with unstaged changes correctly', async () => {
    // Setup: Create task on main
    createTaskFile('009', 'todo');

    // Create feature branch
    createBranchWithCommit('feature/unstaged');

    // Create both staged and unstaged changes
    addLocalChanges('staged.txt', 'staged content');
    execSync('git add staged.txt', { cwd: testDir, stdio: 'ignore' });
    addLocalChanges('unstaged.txt', 'unstaged content');

    updateTaskStatus('009', 'in-progress');

    // Action: Commit on main
    const result = await gitService.commitTaskStatusChangeOnBranch(
      '009',
      'in-progress',
      'main',
    );

    // Assert: Success
    expect(result).toBe(true);
    expect(getCurrentBranch()).toBe('feature/unstaged');

    // Assert: Both files preserved
    expect(fileContentMatches('staged.txt', 'staged content')).toBe(true);
    expect(fileContentMatches('unstaged.txt', 'unstaged content')).toBe(true);
  });
});
