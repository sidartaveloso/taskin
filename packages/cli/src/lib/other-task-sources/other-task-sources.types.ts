import type { TaskSource } from '@opentask/taskin-git-utils';
import type { Task } from '@opentask/taskin-types';

/** A task read outside the current worktree, with where it came from. */
export interface SourcedTask {
  task: Task;
  fileName: string;
  source: TaskSource;
}

export interface MergedTaskSources {
  /** Tasks that exist only in another source, one per id, by precedence. */
  extra: SourcedTask[];
  /** Status that differs, or one number used by two different files. */
  notices: string[];
}
