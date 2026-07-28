import type { CreateTaskResult } from '@opentask/taskin-task-manager';
import type { Task } from '@opentask/taskin-types';

/**
 * A task backed by a markdown file on disk.
 *
 * This type lives here — and not in the provider-agnostic `task-manager`
 * package — because `content` and `filePath` only mean something for a file
 * system backing store. A GitHub or Redmine provider declares its own shape.
 *
 * @public
 */
export type TaskFile = Task & {
  /** The raw markdown content of the task file */
  content: string;
  /** Absolute or relative path to the task file */
  filePath: string;
};

/**
 * Result of creating a task on disk.
 *
 * Widens the generic {@link CreateTaskResult} with the path that was written,
 * which callers holding a concrete `FileSystemTaskProvider` can rely on.
 *
 * @public
 */
export type CreateTaskFileResult = CreateTaskResult<TaskFile> & {
  /** The file path where the task was created */
  filePath: string;
};
