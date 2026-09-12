import type { Task, TaskId, TaskType } from '@opentask/taskin-types';

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
 * Result of creating a new task.
 *
 * Providers are free to return a wider object (e.g. the file system provider
 * adds `filePath`); returning extra fields is allowed because the result is
 * only ever consumed through this contract.
 *
 * @typeParam TTask - The task shape produced by the provider
 * @public
 */
export interface CreateTaskResult<TTask extends Task = Task> {
  /** The created task */
  task: TTask;
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
 * Interface for task storage providers.
 * Implementations handle reading and writing tasks from different sources
 * (e.g., file system, GitHub issues, Redmine).
 *
 * The task shape is a type parameter so that a provider can enrich `Task` with
 * whatever its backing store requires — the file system provider carries
 * `content`/`filePath`, a Redmine provider would carry its own fields — without
 * that shape leaking into this package. Consumers that do not care about the
 * extra fields can simply use the default and work with plain `Task`.
 *
 * @typeParam TTask - The task shape this provider reads and writes
 * @public
 */
/*
 * Os membros sao propriedades de funcao, nao metodos, de proposito: TypeScript
 * trata metodos como bivariantes mesmo com `strictFunctionTypes`, e isso
 * deixava `ITaskProvider<TaskFile>` ser atribuido a `ITaskProvider<Task>` — o
 * que compila e depois quebra em `updateTask`, que le `task.filePath`.
 */
export interface ITaskProvider<TTask extends Task = Task> {
  /**
   * Initialize the provider, performing any necessary setup or loading.
   * This may involve reading existing tasks, setting up connections, etc.
   */
  initialize: () => Promise<void>;

  /**
   * Find a specific task by its ID.
   * @param taskId - The unique identifier of the task
   * @returns The task if found, undefined otherwise
   */
  findTask: (taskId: TaskId) => Promise<TTask | undefined>;

  /**
   * Retrieve all tasks from the provider.
   * @returns Array of all tasks
   */
  getAllTasks: () => Promise<TTask[]>;

  /**
   * Update an existing task.
   * @param task - The task with updated information
   */
  updateTask: (task: TTask) => Promise<void>;

  /**
   * Create a new task.
   * @param options - Options for creating the task
   * @returns The created task information
   */
  createTask: (options: CreateTaskOptions) => Promise<CreateTaskResult<TTask>>;

  /**
   * Validate all tasks managed by this provider.
   * Each provider knows its own format and validation rules.
   * @param fix - If true, attempt to automatically fix validation issues
   * @returns The lint result with any validation issues found
   */
  lint: (fix?: boolean) => Promise<LintResult>;
}

/**
 * Interface for task management operations.
 * Provides high-level methods for managing task workflow and state transitions.
 *
 * Mirrors the provider's task shape: a manager built on top of the file system
 * provider hands back the provider's richer task, while a manager built on any
 * other provider hands back that provider's shape. This package never needs to
 * know which one it is.
 *
 * @typeParam TTask - The task shape produced by the underlying provider
 * @public
 */
export interface ITaskManager<TTask extends Task = Task> {
  /**
   * Mark a task as finished.
   * Transitions the task to 'done' status.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found
   */
  finishTask: (taskId: TaskId) => Promise<TTask>;

  /**
   * Every task the configured provider knows about.
   *
   * Delegates to the provider, like {@link ITaskManager.lint} does. Listing is
   * a domain question — "what work exists?" — and a consumer that only holds a
   * manager should not need the provider to answer it. The MCP server did, and
   * shipped a `taskin://tasks` resource that answered with a placeholder.
   *
   * @returns The tasks, in whatever order the provider returns them
   */
  getAllTasks: () => Promise<TTask[]>;

  /**
   * Mark a task as ready for review.
   * Transitions the task from 'in-progress' to 'in-review' status.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found or not in 'in-progress' status
   */
  reviewTask: (taskId: TaskId) => Promise<TTask>;

  /**
   * Start working on a task.
   * Transitions the task to 'in-progress' status.
   * Also used to resume a paused task.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found, already in progress, or already done
   */
  startTask: (taskId: TaskId) => Promise<TTask>;

  /**
   * Pause work on a task.
   * Transitions the task from 'in-progress' to 'paused' status.
   * Resume with {@link ITaskManager.startTask}.
   * @param taskId - The unique identifier of the task
   * @returns The updated task
   * @throws Error if task is not found or not in 'in-progress' status
   */
  pauseTask: (taskId: TaskId) => Promise<TTask>;

  /**
   * Create a new task.
   * @param options - Options for creating the task
   * @returns The created task information
   */
  createTask: (options: CreateTaskOptions) => Promise<CreateTaskResult<TTask>>;

  /**
   * Validate all tasks in the system.
   * Delegates to the underlying provider's lint implementation.
   * @param fix - If true, attempt to automatically fix validation issues
   * @returns The lint result with any validation issues found
   */
  lint: (fix?: boolean) => Promise<LintResult>;
}
