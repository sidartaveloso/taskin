import { execFileSync } from 'child_process';

/**
 * The branches autopilot accepts as the status board, in order of preference.
 *
 * @public
 */
export const DEFAULT_BRANCH_CANDIDATES = ['develop', 'main', 'master'] as const;

function refExists(cwd: string, ref: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * The branch autopilot publishes task status to: `develop` if it exists,
 * otherwise `main`, otherwise `master`.
 *
 * Looks at local branches and at `origin/*`, so a fresh clone or a worktree
 * that only knows `origin/develop` still finds it. Never touches the network.
 *
 * @param cwd - Any directory inside the repository
 * @returns The branch, or `null` when none of the candidates exists or `cwd`
 *   is not in a Git repository — no guessing
 * @public
 */
export function detectDefaultBranch(cwd: string = process.cwd()): string | null {
  return (
    DEFAULT_BRANCH_CANDIDATES.find(
      (branch) => refExists(cwd, `refs/heads/${branch}`) || refExists(cwd, `refs/remotes/origin/${branch}`),
    ) ?? null
  );
}
