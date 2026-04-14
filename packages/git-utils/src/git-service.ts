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
