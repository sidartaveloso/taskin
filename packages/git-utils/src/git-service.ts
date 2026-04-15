import { execSync } from 'child_process';
import {
  branchExists,
  checkoutBranch as checkoutBranchUtil,
  createBranch as createBranchUtil,
  getCurrentBranch as getCurrentBranchUtil,
  isGitRepository as isGitRepositoryUtil,
} from './git';
import type { IGitService } from './git-service.types';

/**
 * Concrete implementation of IGitService.
 * Executes Git commands synchronously using Node.js child_process.
 *
 * @public
 */
export class GitService implements IGitService {
  constructor(private readonly cwd: string = process.cwd()) {}

  async addFiles(pattern: string): Promise<boolean> {
    try {
      execSync(`git add ${pattern}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async commit(message: string): Promise<boolean> {
    try {
      execSync(`git commit -m "${message}"`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async addAndCommit(pattern: string, message: string): Promise<boolean> {
    const added = await this.addFiles(pattern);
    if (!added) return false;

    return this.commit(message);
  }

  async commitTaskStatusChange(
    taskId: string,
    status: string,
  ): Promise<boolean> {
    const pattern = `TASKS/task-${taskId}-*.md`;
    const message = `docs(TASKS): task-${taskId} - atualiza status para ${status} [skip-ci]`;

    return this.addAndCommit(pattern, message);
  }

  async commitTaskStatusChangeOnBranch(
    taskId: string,
    status: string,
    defaultBranch?: string,
  ): Promise<boolean> {
    // If no defaultBranch specified, use normal commit
    if (!defaultBranch) {
      return this.commitTaskStatusChange(taskId, status);
    }

    try {
      // Get current branch
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();

      // If already on target branch, commit normally
      if (currentBranch === defaultBranch) {
        return this.commitTaskStatusChange(taskId, status);
      }

      // Capture the modified task file content before stashing
      const taskPattern = `TASKS/task-${taskId}-*.md`;
      let taskFileContent: string | null = null;
      let taskFilePath: string | null = null;
      try {
        const files = execSync(`git ls-files -m ${taskPattern}`, {
          cwd: this.cwd,
          encoding: 'utf8',
          stdio: 'pipe',
        }).trim();
        if (files) {
          taskFilePath = files.split('\n')[0];
          const { readFileSync } = await import('fs');
          taskFileContent = readFileSync(
            `${this.cwd}/${taskFilePath}`,
            'utf-8',
          );
        }
      } catch {
        // No modified task file found — try unstaged check
      }

      // Check if there are other uncommitted changes (besides the task file)
      const hasChanges = await this.hasUncommittedChanges();
      let stashed = false;

      try {
        // Stash all changes if needed (including the task file temporarily)
        if (hasChanges) {
          execSync('git stash push -u -m "taskin-temp-stash"', {
            cwd: this.cwd,
            stdio: 'ignore',
          });
          stashed = true;
        }

        // Checkout target branch
        execSync(`git checkout ${defaultBranch}`, {
          cwd: this.cwd,
          stdio: 'ignore',
        });

        // Write the captured task file content to the target branch
        let committed = false;
        if (taskFileContent && taskFilePath) {
          const { writeFileSync } = await import('fs');
          writeFileSync(
            `${this.cwd}/${taskFilePath}`,
            taskFileContent,
            'utf-8',
          );
          const message = `docs(TASKS): task-${taskId} - atualiza status para ${status} [skip-ci]`;
          committed = await this.addAndCommit(taskPattern, message);
        } else {
          // Fallback: try to commit directly (task might already be staged)
          const message = `docs(TASKS): task-${taskId} - atualiza status para ${status} [skip-ci]`;
          committed = await this.addAndCommit(taskPattern, message);
        }

        // Return to original branch
        execSync(`git checkout ${currentBranch}`, {
          cwd: this.cwd,
          stdio: 'ignore',
        });

        // Pop stash if we stashed
        if (stashed) {
          execSync('git stash pop', {
            cwd: this.cwd,
            stdio: 'ignore',
          });
        }

        return committed;
      } catch {
        // Ensure we return to original branch even on error
        try {
          execSync(`git checkout ${currentBranch}`, {
            cwd: this.cwd,
            stdio: 'ignore',
          });

          if (stashed) {
            execSync('git stash pop', {
              cwd: this.cwd,
              stdio: 'ignore',
            });
          }
        } catch {
          // If we can't restore, at least we tried
        }

        return false;
      }
    } catch {
      return false;
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    try {
      const output = execSync('git status --porcelain', {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    return Promise.resolve(getCurrentBranchUtil());
  }

  async isGitRepository(): Promise<boolean> {
    return Promise.resolve(isGitRepositoryUtil());
  }

  async createBranch(
    branchName: string,
    baseBranch?: string,
  ): Promise<boolean> {
    try {
      createBranchUtil(branchName, baseBranch);
      return true;
    } catch {
      return false;
    }
  }

  async checkoutBranch(branchName: string): Promise<boolean> {
    try {
      if (!branchExists(branchName)) {
        return false;
      }
      checkoutBranchUtil(branchName);
      return true;
    } catch {
      return false;
    }
  }
}
