import type { Task, TaskType, User } from '@opentask/taskin-types';

/**
 * Options for creating a new task
 * @public
 */
export interface CreateTaskOptions {
  /** Task title */
  title: string;
  /** Task type (feat, fix, chore, etc.) */
  type: TaskType;
  /** Optional task description */
  description?: string;
  /** Optional assignee user ID or name */
  assignee?: string;
}

/**
 * Result of creating a new task
 * @public
 */
export interface CreateTaskResult {
  /** The created task */
  task: TaskFile;
  /** The generated task ID */
  taskId: string;
  /** The file path where the task was created */
  filePath: string;
}

/**
 * Severity level for validation issues
 * @public
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A validation error or warning found during linting
 * @public
 */
export interface ValidationIssue {
  /** The file or task that has the issue */
  file: string;
  /** Optional line number where the issue occurs */
  line?: number;
  /** Human-readable description of the issue */
  message: string;
  /** Severity level of the issue */
  severity: ValidationSeverity;
  /** Optional suggestion for fixing the issue */
  suggestion?: string;
}

/**
 * Result of a lint operation
 * @public
 */
export interface LintResult {
  /** Whether the lint passed without errors */
  valid: boolean;
  /** List of validation issues found */
  issues: ValidationIssue[];
  /** Number of errors found */
  errorCount: number;
  /** Number of warnings found */
  warningCount: number;
  /** Number of info messages */
  infoCount: number;
}

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

  /**
   * Create a new task.
   * @param options - Options for creating the task
   * @returns The created task information
   */
  createTask(options: CreateTaskOptions): Promise<CreateTaskResult>;

  /**
   * Validate all tasks managed by this provider.
   * Each provider knows its own format and validation rules.
   * @param fix - If true, attempt to automatically fix validation issues
   * @returns The lint result with any validation issues found
   */
  lint(fix?: boolean): Promise<LintResult>;
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

  /**
   * Create a new task.
   * @param options - Options for creating the task
   * @returns The created task information
   */
  createTask(options: CreateTaskOptions): Promise<CreateTaskResult>;

  /**
   * Validate all tasks in the system.
   * Delegates to the underlying provider's lint implementation.
   * @param fix - If true, attempt to automatically fix validation issues
   * @returns The lint result with any validation issues found
   */
  lint(fix?: boolean): Promise<LintResult>;
}
