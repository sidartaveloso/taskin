import { execFileSync, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildTaskStatusCommitMessage, DEFAULT_CI_SKIP_TAG } from './commit-message';
import { createBranch as createBranchUtil, isGitRepository as isGitRepositoryUtil } from './git';
import type { IGitService, WorkCommitResult } from './git-service.types';
import { addedLinesFromDiff, findSecretsInLine, type SensitiveFinding, sensitivePathReason } from './sensitive-changes';

/** Acima disso o arquivo e gerado ou binario; nao vale ler linha a linha. */
const MAX_SCANNED_BYTES = 1024 * 1024;

interface WorkingTreeChange {
  path: string;
  untracked: boolean;
  deleted: boolean;
}

/** `addFiles` recebe varios caminhos separados por espaco (`a b`). */
function splitPathspecs(pattern: string): string[] {
  return pattern.split(/\s+/).filter(Boolean);
}

/**
 * Construction options for {@link GitService}.
 *
 * @public
 */
export interface GitServiceOptions {
  /**
   * Tag appended to the commits Taskin writes on its own, so those commits do
   * not trigger the project's pipeline. Defaults to `[skip ci]`; an empty
   * string appends nothing, which is how a project asks for CI to run.
   *
   * The service takes it as a parameter rather than reading `.taskin.json`:
   * the config file belongs to the CLI, and this package stays testable
   * without touching disk.
   */
  ciSkipTag?: string;
}

/**
 * Concrete implementation of IGitService.
 * Executes Git commands synchronously using Node.js child_process.
 *
 * @public
 */
export class GitService implements IGitService {
  private readonly ciSkipTag: string;

  constructor(
    private readonly cwd: string = process.cwd(),
    options: GitServiceOptions = {},
  ) {
    this.ciSkipTag = options.ciSkipTag ?? DEFAULT_CI_SKIP_TAG;
  }

  async addFiles(pattern: string): Promise<boolean> {
    try {
      this.git(['add', '--', ...splitPathspecs(pattern)]);
      return true;
    } catch {
      return false;
    }
  }

  async commit(message: string, paths?: string[]): Promise<boolean> {
    try {
      // Com caminhos, o commit grava so eles, e o resto do index fica como
      // estava. Sem caminhos, grava o index inteiro — e o que a pessoa
      // deixou staged vai junto (task-110).
      this.git(['commit', '-m', message, ...(paths?.length ? ['--', ...paths] : [])]);
      return true;
    } catch {
      return false;
    }
  }

  async addAndCommit(pattern: string, message: string): Promise<boolean> {
    const added = await this.addFiles(pattern);
    if (!added) return false;

    return this.commit(message, splitPathspecs(pattern));
  }

  async commitWork(message: string): Promise<WorkCommitResult> {
    let changes: WorkingTreeChange[];
    try {
      changes = this.workingTreeChanges();
    } catch {
      return { status: 'failed' };
    }
    if (changes.length === 0) return { status: 'nothing-to-commit' };

    // Olha antes de adicionar: recusar nao pode deixar nada staged para tras.
    const findings = changes.flatMap((change) => this.inspect(change));
    if (findings.length > 0) return { status: 'blocked', findings };

    const files = changes.map((change) => change.path).sort();
    try {
      this.git(['add', '-A']);
      this.git(['commit', '-m', message, '-m', ['Files:', ...files.map((file) => `- ${file}`)].join('\n')]);
      return { status: 'committed', files };
    } catch {
      return { status: 'failed' };
    }
  }

  /** Roda o git sem shell: nada na mensagem ou no caminho e interpretado. */
  private git(args: string[]): string {
    return execFileSync('git', args, { cwd: this.cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
  }

  private workingTreeChanges(): WorkingTreeChange[] {
    const output = this.git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']);
    return output
      .split('\0')
      .filter((entry) => entry.length > 3)
      .map((entry) => {
        const code = entry.slice(0, 2);
        return {
          path: entry.slice(3),
          untracked: code === '??',
          deleted: code.includes('D'),
        };
      });
  }

  private inspect(change: WorkingTreeChange): SensitiveFinding[] {
    // Apagar um arquivo sensivel e o que se quer; nao ha o que recusar.
    if (change.deleted) return [];

    const reason = sensitivePathReason(change.path);
    if (reason) return [{ path: change.path, reason }];

    const added = this.addedLines(change);
    for (const { line, text } of added) {
      const secret = findSecretsInLine(text);
      if (secret) return [{ path: change.path, reason: secret, line }];
    }
    return [];
  }

  private addedLines(change: WorkingTreeChange): { line: number; text: string }[] {
    try {
      if (change.untracked) {
        const content = readFileSync(join(this.cwd, change.path));
        if (content.length > MAX_SCANNED_BYTES || content.includes(0)) return [];
        return content
          .toString('utf8')
          .split('\n')
          .map((text, index) => ({ line: index + 1, text }));
      }
      // Contra o HEAD: cobre o que esta staged e o que nao esta.
      const diff = this.git(['diff', 'HEAD', '--no-color', '--no-ext-diff', '-U0', '--', change.path]);
      if (diff.length > MAX_SCANNED_BYTES || diff.includes('Binary files')) return [];
      return addedLinesFromDiff(diff);
    } catch {
      return [];
    }
  }

  async commitTaskStatusChange(taskId: string, status: string): Promise<boolean> {
    const pattern = `TASKS/task-${taskId}-*.md`;
    const message = buildTaskStatusCommitMessage({ taskId, status, ciSkipTag: this.ciSkipTag });

    return this.addAndCommit(pattern, message);
  }

  async commitTaskStatusChangeOnBranch(taskId: string, status: string, defaultBranch?: string): Promise<boolean> {
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
          taskFilePath = files.split('\n')[0] ?? null;
          taskFileContent = readFileSync(`${this.cwd}/${taskFilePath}`, 'utf-8');
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
          writeFileSync(`${this.cwd}/${taskFilePath}`, taskFileContent, 'utf-8');
          const message = buildTaskStatusCommitMessage({ taskId, status, ciSkipTag: this.ciSkipTag });
          committed = await this.addAndCommit(taskPattern, message);
        } else {
          // Fallback: try to commit directly (task might already be staged)
          const message = buildTaskStatusCommitMessage({ taskId, status, ciSkipTag: this.ciSkipTag });
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
    try {
      return execSync('git branch --show-current', {
        cwd: this.cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
    } catch {
      return '';
    }
  }

  async isGitRepository(): Promise<boolean> {
    return Promise.resolve(isGitRepositoryUtil());
  }

  async createBranch(branchName: string, baseBranch?: string): Promise<boolean> {
    try {
      createBranchUtil(branchName, baseBranch);
      return true;
    } catch {
      return false;
    }
  }

  async checkoutBranch(branchName: string): Promise<boolean> {
    try {
      execSync(`git checkout ${branchName}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async fetch(remote: string = 'origin'): Promise<boolean> {
    try {
      execSync(`git fetch ${remote}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async rebase(branch: string): Promise<boolean> {
    try {
      execSync(`git rebase ${branch}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async push(branch: string, remote: string = 'origin'): Promise<boolean> {
    try {
      execSync(`git push ${remote} ${branch}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async abortRebase(): Promise<boolean> {
    try {
      execSync('git rebase --abort', {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkoutFile(branch: string, pattern: string): Promise<boolean> {
    try {
      execSync(`git checkout ${branch} -- ${pattern}`, {
        cwd: this.cwd,
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }
}
