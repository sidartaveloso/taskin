/**
 * Checks if the current directory is a Git repository.
 * @returns True if it is a Git repository, false otherwise.
 */
export declare function isGitRepository(): boolean;
/**
 * Gets the current branch name.
 * @returns The current branch name.
 */
export declare function getCurrentBranch(): string;
/**
 * Checks if a branch exists.
 * @param branchName The name of the branch to check.
 * @returns True if the branch exists, false otherwise.
 */
export declare function branchExists(branchName: string): boolean;
/**
 * Creates a new branch.
 * @param branchName The name of the new branch.
 * @param baseBranch The branch to create the new branch from. Defaults to the current branch.
 */
export declare function createBranch(
  branchName: string,
  baseBranch?: string,
): void;
/**
 * Switches to an existing branch.
 * @param branchName The name of the branch to switch to.
 */
export declare function checkoutBranch(branchName: string): void;
//# sourceMappingURL=git.d.ts.map
