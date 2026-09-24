import type { SensitiveFinding } from './sensitive-changes';

/**
 * Outcome of {@link IGitService.commitWork}.
 *
 * @public
 */
export type WorkCommitResult =
  | { status: 'committed'; files: string[] }
  | { status: 'nothing-to-commit' }
  | { status: 'blocked'; findings: SensitiveFinding[] }
  | { status: 'failed' };

/**
 * Git service interface for dependency injection and testing.
 * Provides high-level Git operations for task management.
 *
 * @public
 */
export interface IGitService {
  /**
   * Add files to Git staging area.
   * @param pattern - File pattern to add (e.g., "TASKS/*.md", ".")
   * @returns True if files were added successfully
   */
  addFiles(pattern: string): Promise<boolean>;

  /**
   * Create a Git commit with a message.
   * @param message - Commit message
   * @param paths - When given, only these paths are committed; everything
   *   else in the index stays staged and out of the commit. Without them the
   *   whole index is committed, whatever the user had staged included.
   * @returns True if commit was created successfully
   */
  commit(message: string, paths?: string[]): Promise<boolean>;

  /**
   * Add files and commit exactly those files, never the rest of the index.
   * @param pattern - File pattern to add (several separated by spaces)
   * @param message - Commit message
   * @returns True if operation succeeded
   */
  addAndCommit(pattern: string, message: string): Promise<boolean>;

  /**
   * Commit every change in the working tree (`git add -A`), unless one of
   * them looks sensitive: an environment file, a private key, a credentials
   * file, or an added line carrying a token. Then nothing is staged or
   * committed, and the findings are returned for the user to decide.
   * The commit body lists the files, so the subject never hides what went in.
   * @param message - Commit subject
   */
  commitWork(message: string): Promise<WorkCommitResult>;

  /**
   * Commit task status change with standardized message format.
   * @param taskId - Task identifier (e.g., "014")
   * @param status - New status (e.g., "in-progress", "paused", "done")
   * @returns True if commit was created successfully
   */
  commitTaskStatusChange(taskId: string, status: string): Promise<boolean>;

  /**
   * Commit task status change to a specific branch.
   * If defaultBranch is provided and different from current branch,
   * will temporarily switch to it, commit, and return to original branch.
   * @param taskId - Task identifier (e.g., "014")
   * @param status - New status (e.g., "in-progress", "paused", "done")
   * @param defaultBranch - Optional target branch for the commit
   * @returns True if commit was created successfully
   */
  commitTaskStatusChangeOnBranch(taskId: string, status: string, defaultBranch?: string): Promise<boolean>;

  /**
   * Check if repository has uncommitted changes.
   * @returns True if there are uncommitted changes
   */
  hasUncommittedChanges(): Promise<boolean>;

  /**
   * Get current Git branch name.
   * @returns Branch name or empty string if not in a repo
   */
  getCurrentBranch(): Promise<string>;

  /**
   * Check if current directory is a Git repository.
   * @returns True if in a Git repository
   */
  isGitRepository(): Promise<boolean>;

  /**
   * Create a new branch and switch to it.
   * @param branchName - Name of the new branch
   * @param baseBranch - Optional base branch (defaults to current)
   * @returns True if branch was created successfully
   */
  createBranch(branchName: string, baseBranch?: string): Promise<boolean>;

  /**
   * Switch to an existing branch.
   * @param branchName - Name of the branch to switch to
   * @returns True if checkout succeeded
   */
  checkoutBranch(branchName: string): Promise<boolean>;

  /**
   * Fetch from a remote repository.
   * @param remote - Remote name (defaults to 'origin')
   * @returns True if fetch succeeded
   */
  fetch(remote?: string): Promise<boolean>;

  /**
   * Rebase current branch onto another branch.
   * @param branch - Branch to rebase onto (e.g., 'origin/tasks')
   * @returns True if rebase succeeded
   */
  rebase(branch: string): Promise<boolean>;

  /**
   * Push current branch to a remote repository.
   * @param branch - Branch to push
   * @param remote - Remote name (defaults to 'origin')
   * @returns True if push succeeded
   */
  push(branch: string, remote?: string): Promise<boolean>;

  /**
   * Abort current rebase operation.
   * @returns True if abort succeeded
   */
  abortRebase(): Promise<boolean>;

  /**
   * Checkout files from another branch into the working directory.
   * Equivalent to `git checkout <branch> -- <pattern>`.
   * @param branch - Source branch to checkout from
   * @param pattern - File pattern to checkout
   * @returns True if checkout succeeded
   */
  checkoutFile(branch: string, pattern: string): Promise<boolean>;
}
