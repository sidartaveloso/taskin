/**
 * Represents the status of a Git repository.
 */
export interface GitStatus {
  currentBranch: string;
  hasUncommittedChanges: boolean;
  isGitRepo: boolean;
  modifiedFiles: string[];
}
