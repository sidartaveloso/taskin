/**
 * Where a task file was read from, other than the current worktree.
 *
 * - `worktree`: another local worktree of the same repository, read from its
 *   folder, so a task created there and not yet committed is seen too.
 * - `ref`: a local ref (`<defaultBranch>` or `origin/<defaultBranch>` as of
 *   the last fetch), read with `ls-tree`/`cat-file`, without the network.
 */
export type TaskSource = { kind: 'worktree'; path: string; branch: string | null } | { kind: 'ref'; ref: string };

export interface LocalTaskFile {
  /** File name only, e.g. `task-048-guia.md`. */
  fileName: string;
  content: string;
  source: TaskSource;
}

export interface ListLocalTaskSourcesOptions {
  /** Any folder inside the current worktree. */
  cwd: string;
  /** Absolute path of the tasks folder in the current worktree. */
  tasksDirectory: string;
  /** Branch whose local refs are read; without it, only the other worktrees. */
  defaultBranch?: string;
  /**
   * Run `git fetch origin <defaultBranch>` first. Only with autoSync: the
   * default reads what is already on this machine and never needs a network.
   */
  fetch?: boolean;
}

export interface LocalTaskSources {
  /**
   * Task files outside the current worktree, in precedence order: the
   * worktree that has the default branch open, the local default branch,
   * `origin/<defaultBranch>`, then the other worktrees.
   */
  files: LocalTaskFile[];
  /** Non-fatal problems, such as a fetch that failed. */
  warnings: string[];
}
