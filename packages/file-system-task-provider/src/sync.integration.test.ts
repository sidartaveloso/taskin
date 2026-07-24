import { GitService } from '@opentask/taskin-git-utils';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SyncConfig } from './auto-sync';
import { pushAfterCreate, squashTaskFileOnDone, syncBeforeCreate } from './auto-sync';

// ============================================================================
// Helpers
// ============================================================================

function createBareRepo(dir: string): void {
  execSync('git init --bare', { cwd: dir, stdio: 'ignore' });
}

function cloneRepo(bareDir: string, targetDir: string): void {
  execSync(`git clone ${bareDir} ${targetDir}`, { stdio: 'ignore' });
}

function initRepo(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@taskin.dev"', {
    cwd: dir,
    stdio: 'ignore',
  });
  execSync('git config user.name "Taskin Test"', {
    cwd: dir,
    stdio: 'ignore',
  });
}

function initialCommit(dir: string): void {
  writeFileSync(join(dir, 'README.md'), '# Test Repo');
  execSync('git add .', { cwd: dir, stdio: 'ignore' });
  execSync('git commit -m "Initial commit"', { cwd: dir, stdio: 'ignore' });
}

function createBranch(dir: string, branch: string): void {
  execSync(`git checkout -b ${branch}`, { cwd: dir, stdio: 'ignore' });
}

function pushBranch(dir: string, branch: string): void {
  execSync(`git push -u origin ${branch}`, { cwd: dir, stdio: 'ignore' });
}

function getCurrentBranch(dir: string): string {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: dir,
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function getCommitCount(dir: string, branch: string): number {
  const output = execSync(`git rev-list --count ${branch}`, {
    cwd: dir,
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
  return parseInt(output, 10);
}

function createTaskFile(dir: string, taskId: string, status: string): void {
  mkdirSync(join(dir, 'TASKS'), { recursive: true });
  const content = `# Task ${taskId}\n\nStatus: ${status}\n`;
  writeFileSync(join(dir, 'TASKS', `task-${taskId}-title.md`), content);
  execSync('git add TASKS/', { cwd: dir, stdio: 'ignore' });
  execSync(`git commit -m "Create task ${taskId}"`, {
    cwd: dir,
    stdio: 'ignore',
  });
}

function setupRemoteBare(): string {
  const bareDir = mkdtempSync(join(tmpdir(), 'taskin-sync-bare-'));
  createBareRepo(bareDir);
  return bareDir;
}

function setupClone(bareDir: string, prefix: string): { dir: string; gitService: GitService } {
  const cloneDir = mkdtempSync(join(tmpdir(), `${prefix}-`));
  cloneRepo(bareDir, cloneDir);
  const gitService = new GitService(cloneDir);
  return { dir: cloneDir, gitService };
}

// ============================================================================
// Integration Tests — Ciclo 8
// ============================================================================

describe('AutoSync Integration', () => {
  let bareDir: string;
  let cloneA: { dir: string; gitService: GitService };
  let cloneB: { dir: string; gitService: GitService };
  const cleanupDirs: string[] = [];

  beforeEach(() => {
    bareDir = setupRemoteBare();
    cleanupDirs.push(bareDir);

    // Initialize bare with initial commit on tasks branch
    const tempDir = mkdtempSync(join(tmpdir(), 'taskin-sync-init-'));
    cleanupDirs.push(tempDir);
    initRepo(tempDir);
    initialCommit(tempDir);
    createBranch(tempDir, 'tasks');
    execSync(`git remote add origin ${bareDir}`, {
      cwd: tempDir,
      stdio: 'ignore',
    });
    pushBranch(tempDir, 'tasks');

    // Clone A
    cloneA = setupClone(bareDir, 'taskin-sync-a');
    execSync('git checkout tasks', { cwd: cloneA.dir, stdio: 'ignore' });
    cleanupDirs.push(cloneA.dir);

    // Clone B
    cloneB = setupClone(bareDir, 'taskin-sync-b');
    execSync('git checkout tasks', { cwd: cloneB.dir, stdio: 'ignore' });
    cleanupDirs.push(cloneB.dir);
  });

  afterEach(() => {
    for (const dir of cleanupDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort cleanup
      }
    }
    cleanupDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // Cenário 1 — Fluxo Básico (sem conflito)
  // --------------------------------------------------------------------------
  it('Cenário 1: should sync before create and push task to remote', async () => {
    const config: SyncConfig = {
      autoSync: true,
      defaultBranch: 'tasks',
    };

    await syncBeforeCreate(cloneA.gitService, config);

    // Create a task file manually (simulating taskin new)
    mkdirSync(join(cloneA.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneA.dir, 'TASKS', 'task-001-my-feature.md'), '# Task 001 — My Feature\n\nStatus: pending\n');

    await pushAfterCreate(cloneA.gitService, {
      taskId: '001',
      title: 'My Feature',
      defaultBranch: 'tasks',
    });

    // Verify task file exists in bare repo
    const bareClone = mkdtempSync(join(tmpdir(), 'taskin-sync-verify-'));
    cleanupDirs.push(bareClone);
    execSync(`git clone ${bareDir} ${bareClone}`, { stdio: 'ignore' });
    execSync('git checkout tasks', { cwd: bareClone, stdio: 'ignore' });

    const taskFile = join(bareClone, 'TASKS', 'task-001-my-feature.md');
    expect(existsSync(taskFile)).toBe(true);
    const content = readFileSync(taskFile, 'utf-8');
    expect(content).toContain('Task 001');
  });

  // --------------------------------------------------------------------------
  // Cenário 2 — Corrida entre dois usuários
  // --------------------------------------------------------------------------
  it('Cenário 2: two users creating tasks simultaneously should not collide', async () => {
    // User A creates task-001
    await syncBeforeCreate(cloneA.gitService, {
      autoSync: true,
      defaultBranch: 'tasks',
    });
    mkdirSync(join(cloneA.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneA.dir, 'TASKS', 'task-001-feat-a.md'), '# Task 001 — Feat A\n\nStatus: pending\n');
    await pushAfterCreate(cloneA.gitService, {
      taskId: '001',
      title: 'Feat A',
      defaultBranch: 'tasks',
    });

    // User B creates task (should sync and get next number)
    await syncBeforeCreate(cloneB.gitService, {
      autoSync: true,
      defaultBranch: 'tasks',
    });
    mkdirSync(join(cloneB.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneB.dir, 'TASKS', 'task-002-feat-b.md'), '# Task 002 — Feat B\n\nStatus: pending\n');
    await pushAfterCreate(cloneB.gitService, {
      taskId: '002',
      title: 'Feat B',
      defaultBranch: 'tasks',
    });

    // Verify both tasks exist in remote
    const bareClone = mkdtempSync(join(tmpdir(), 'taskin-sync-verify-'));
    cleanupDirs.push(bareClone);
    execSync(`git clone ${bareDir} ${bareClone}`, { stdio: 'ignore' });
    execSync('git checkout tasks', { cwd: bareClone, stdio: 'ignore' });

    expect(existsSync(join(bareClone, 'TASKS', 'task-001-feat-a.md'))).toBe(true);
    expect(existsSync(join(bareClone, 'TASKS', 'task-002-feat-b.md'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cenário 3 — Conflito de rebase real
  // --------------------------------------------------------------------------
  it('Cenário 3: should abort rebase and restore original state on conflict', async () => {
    // Create conflicting change in clone B's remote tracking
    mkdirSync(join(cloneB.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneB.dir, 'TASKS', 'conflict.md'), 'original content\n');
    execSync('git add TASKS/conflict.md', { cwd: cloneB.dir, stdio: 'ignore' });
    execSync('git commit -m "Add conflict file"', {
      cwd: cloneB.dir,
      stdio: 'ignore',
    });
    execSync('git push', { cwd: cloneB.dir, stdio: 'ignore' });

    // In clone A, create a conflicting change on the same file
    mkdirSync(join(cloneA.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneA.dir, 'TASKS', 'conflict.md'), 'divergent content\n');
    execSync('git add TASKS/conflict.md', { cwd: cloneA.dir, stdio: 'ignore' });
    execSync('git commit -m "Divergent change"', {
      cwd: cloneA.dir,
      stdio: 'ignore',
    });

    // Also add a local uncommitted task change
    mkdirSync(join(cloneA.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneA.dir, 'TASKS', 'task-001-test.md'), '# Task 001\n\nStatus: pending\n');

    // Attempt syncBeforeCreate — should fail due to conflict
    const originalBranch = getCurrentBranch(cloneA.dir);

    await expect(
      syncBeforeCreate(cloneA.gitService, {
        autoSync: true,
        defaultBranch: 'tasks',
      }),
    ).rejects.toThrow();

    // Verify we're back on the original branch
    expect(getCurrentBranch(cloneA.dir)).toBe(originalBranch);

    // Verify the uncommitted task file is still present (not lost by rebase)
    expect(existsSync(join(cloneA.dir, 'TASKS', 'task-001-test.md'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cenário 4 — autoSync desativado
  // --------------------------------------------------------------------------
  it('Cenário 4: should skip sync when autoSync=false', async () => {
    const initialBareRef = execSync('git rev-parse HEAD', {
      cwd: cloneA.dir,
      encoding: 'utf8',
    }).trim();

    await syncBeforeCreate(cloneA.gitService, {
      autoSync: false,
      defaultBranch: 'tasks',
    });

    // No fetch/rebase should have happened — HEAD unchanged
    const currentRef = execSync('git rev-parse HEAD', {
      cwd: cloneA.dir,
      encoding: 'utf8',
    }).trim();
    expect(currentRef).toBe(initialBareRef);
  });

  // --------------------------------------------------------------------------
  // Cenário 5 — Retry em caso de push rejeitado
  // --------------------------------------------------------------------------
  it('Cenário 5: should retry push when rejected and eventually succeed', async () => {
    // Push something from clone B so clone A's push will be rejected
    mkdirSync(join(cloneB.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneB.dir, 'TASKS', 'blocker.md'), 'blocker content\n');
    execSync('git add TASKS/', { cwd: cloneB.dir, stdio: 'ignore' });
    execSync('git commit -m "Blocker"', { cwd: cloneB.dir, stdio: 'ignore' });
    execSync('git push', { cwd: cloneB.dir, stdio: 'ignore' });

    // Clone A tries to pushAfterCreate — will push, get rejected, retry, succeed
    mkdirSync(join(cloneA.dir, 'TASKS'), { recursive: true });
    writeFileSync(join(cloneA.dir, 'TASKS', 'task-001-test.md'), '# Task 001\n\nStatus: pending\n');

    const result = await pushAfterCreate(cloneA.gitService, {
      taskId: '001',
      title: 'Test',
      defaultBranch: 'tasks',
    });
    expect(result).toBe(true);

    // Verify: remote has both blocker and A's task
    const bareClone = mkdtempSync(join(tmpdir(), 'taskin-sync-verify-'));
    cleanupDirs.push(bareClone);
    execSync(`git clone ${bareDir} ${bareClone}`, { stdio: 'ignore' });
    execSync('git checkout tasks', { cwd: bareClone, stdio: 'ignore' });

    expect(existsSync(join(bareClone, 'TASKS', 'blocker.md'))).toBe(true);
    expect(existsSync(join(bareClone, 'TASKS', 'task-001-test.md'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cenário 6 — Squash para originBranch ao marcar task como done
  // --------------------------------------------------------------------------
  it('Cenário 6: should squash only the done task file to originBranch', async () => {
    // Setup: create tasks branch and develop branch
    execSync('git checkout tasks', { cwd: cloneA.dir, stdio: 'ignore' });

    // Create task-042 with multiple status changes
    createTaskFile(cloneA.dir, '042', 'pending');
    writeFileSync(join(cloneA.dir, 'TASKS', 'task-042-title.md'), '# Task 042\n\nStatus: in-progress\n');
    execSync('git add TASKS/task-042-title.md', {
      cwd: cloneA.dir,
      stdio: 'ignore',
    });
    execSync('git commit -m "task-042 in-progress"', {
      cwd: cloneA.dir,
      stdio: 'ignore',
    });

    // Create task-043 (still in progress)
    createTaskFile(cloneA.dir, '043', 'pending');

    // Push tasks branch to bare
    execSync('git push -u origin tasks', { cwd: cloneA.dir, stdio: 'ignore' });

    // Create develop branch in bare (simulate originBranch)
    const tempDir = mkdtempSync(join(tmpdir(), 'taskin-sync-dev-'));
    cleanupDirs.push(tempDir);
    execSync(`git clone ${bareDir} ${tempDir}`, { stdio: 'ignore' });
    execSync('git checkout --orphan develop', { cwd: tempDir, stdio: 'ignore' });
    writeFileSync(join(tempDir, 'README.md'), '# Develop');
    execSync('git add .', { cwd: tempDir, stdio: 'ignore' });
    execSync('git commit -m "Initial develop"', {
      cwd: tempDir,
      stdio: 'ignore',
    });
    execSync('git push -u origin develop', { cwd: tempDir, stdio: 'ignore' });

    // Pull develop into clone A
    execSync('git fetch origin develop', {
      cwd: cloneA.dir,
      stdio: 'ignore',
    });
    execSync('git checkout develop', { cwd: cloneA.dir, stdio: 'ignore' });
    execSync('git checkout tasks', { cwd: cloneA.dir, stdio: 'ignore' });

    // Action: squash task-042 to develop
    await squashTaskFileOnDone(cloneA.gitService, {
      taskId: '042',
      defaultBranch: 'tasks',
      originBranch: 'develop',
    });

    // Verify: develop has exactly 1 new commit (the squash)
    const developCommitCount = getCommitCount(cloneA.dir, 'origin/develop');
    expect(developCommitCount).toBe(2); // initial commit + 1 squash

    // Verify: squash contains only task-042, not task-043
    const squashContent = execSync('git show origin/develop:TASKS/task-042-title.md', {
      cwd: cloneA.dir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    expect(squashContent).toContain('Task 042');

    // task-043 should NOT be in develop
    const task043Exists = execSync('git ls-tree -r origin/develop --name-only', {
      cwd: cloneA.dir,
      encoding: 'utf8',
      stdio: 'pipe',
    })
      .trim()
      .includes('task-043');
    expect(task043Exists).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Cenário 7 — originBranch não configurado
  // --------------------------------------------------------------------------
  it('Cenário 7: should not squash when originBranch is not configured', async () => {
    execSync('git checkout tasks', { cwd: cloneA.dir, stdio: 'ignore' });
    createTaskFile(cloneA.dir, '050', 'pending');

    // Attempt squash without originBranch
    const result = await squashTaskFileOnDone(cloneA.gitService, {
      taskId: '050',
      defaultBranch: 'tasks',
      originBranch: undefined,
    });

    expect(result).toBe(false);
  });
});
