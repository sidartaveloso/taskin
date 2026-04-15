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
   * @returns True if commit was created successfully
   */
  commit(message: string): Promise<boolean>;

  /**
   * Add files and commit in a single operation.
   * @param pattern - File pattern to add
   * @param message - Commit message
   * @returns True if operation succeeded
   */
  addAndCommit(pattern: string, message: string): Promise<boolean>;

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
  commitTaskStatusChangeOnBranch(
    taskId: string,
    status: string,
    defaultBranch?: string,
  ): Promise<boolean>;

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
}
