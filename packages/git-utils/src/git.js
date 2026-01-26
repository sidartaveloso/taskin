import { execSync } from 'child_process';
/**
 * Executes a Git command synchronously.
 * @param command The Git command to execute.
 * @returns The stdout from the command.
 * @throws If the command fails.
 */
function executeGit(command) {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}
/**
 * Checks if the current directory is a Git repository.
 * @returns True if it is a Git repository, false otherwise.
 */
export function isGitRepository() {
  return !!executeGit('rev-parse --is-inside-work-tree');
}
/**
 * Gets the current branch name.
 * @returns The current branch name.
 */
export function getCurrentBranch() {
  return executeGit('branch --show-current');
}
/**
 * Checks if a branch exists.
 * @param branchName The name of the branch to check.
 * @returns True if the branch exists, false otherwise.
 */
export function branchExists(branchName) {
  return !!executeGit(`show-ref --verify --quiet refs/heads/${branchName}`);
}
/**
 * Creates a new branch.
 * @param branchName The name of the new branch.
 * @param baseBranch The branch to create the new branch from. Defaults to the current branch.
 */
export function createBranch(branchName, baseBranch) {
  const base = baseBranch || getCurrentBranch();
  executeGit(`checkout -b ${branchName} ${base}`);
}
/**
 * Switches to an existing branch.
 * @param branchName The name of the branch to switch to.
 */
export function checkoutBranch(branchName) {
  executeGit(`checkout ${branchName}`);
}
//# sourceMappingURL=git.js.map
