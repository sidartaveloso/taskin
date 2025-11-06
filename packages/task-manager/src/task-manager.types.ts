import type { Task, TaskType, User } from '@taskin/types-ts';

/**
 * A task with additional file system metadata.
 * Extends the base Task type with content and path information.
 * @public
 */
export type TaskFile = Task & {
  /** The raw markdown content of the task file */
  content: string;
  /** Absolute or relative path to the task file */
  filePath: string;
  /** The type of work this task represents */
  type: TaskType;
  /** Optional user assigned to this task */
  assignee?: User;
};

/**
 * Interface for task storage providers.
 * Implementations handle reading and writing tasks from different sources
 * (e.g., file system, database, API).
 * @public
 */
export interface ITaskProvider {
  /**
   * Find a specific task by its ID.
   * @param taskId - The unique identifier of the task
   * @returns The task if found, undefined otherwise
   */
  findTask(taskId: string): Promise<TaskFile | undefined>;

  /**
   * Retrieve all tasks from the provider.
   * @returns Array of all tasks
   */
  getAllTasks(): Promise<TaskFile[]>;

  /**
   * Update an existing task.
   * @param task - The task with updated information
   */
  updateTask(task: TaskFile): Promise<void>;
}

/**
 * Interface for task management operations.
 * Provides high-level methods for managing task workflow and state transitions.
 * @public
 */
export interface ITaskManager {
  /**
   * Mark a task as finished.
   * Transitions the task to 'done' status.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found
   */
  finishTask(taskId: string): Promise<TaskFile>;

  /**
   * Start working on a task.
   * Transitions the task to 'in-progress' status.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found, already in progress, or already done
   */
  startTask(taskId: string): Promise<TaskFile>;
}
