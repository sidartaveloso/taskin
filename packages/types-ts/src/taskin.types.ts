/**
 * Taskin Core Interface
 * Main interface for task management operations
 */

import type { z } from 'zod';
import type {
  TaskIdSchema,
  TaskSchema,
  TaskStatusSchema,
  TaskTypeSchema,
  UserSchema,
} from './taskin.schemas';

export interface ListTasksOptions {
  assignee?: string;
  status?: string;
  type?: string;
}

export interface CreateTaskOptions {
  description?: string;
  title?: string;
  type?: string;
  user?: string;
}

export interface StartTaskOptions {
  base?: string;
  force?: boolean;
}

export interface PauseTaskOptions {
  message?: string;
  skipCommit?: boolean;
  sound?: boolean;
}

export interface FinishTaskOptions {
  push?: boolean;
  skipUpdate?: boolean;
}

export interface LintTasksOptions {
  path?: string;
  fix?: boolean;
}

/**
 * Validation issue found during task linting
 * Provider-agnostic - works with any task storage backend
 */
export interface TaskValidationIssue {
  message: string;
  severity: 'error' | 'warning';
  taskId: string;
  line?: number;
}

/**
 * Task metadata extracted from task source
 */
export interface TaskMetadata {
  assignee?: string;
  status?: string;
  type?: string;
}

/**
 * Result of task validation/linting operation
 */
export interface LintResult {
  errors: TaskValidationIssue[];
  tasksChecked: number;
  valid: boolean;
  warnings: TaskValidationIssue[];
}

/**
 * Provider configuration information
 */
export interface ProviderInfo {
  configSchema: {
    properties: Record<
      string,
      {
        description: string;
        type: string;
        secret?: boolean;
      }
    >;
    required: string[];
  };
  description: string;
  id: string;
  name: string;
  packageName: string;
  status: 'stable' | 'beta' | 'coming-soon';
}

/**
 * ITaskin - Core interface for task management system
 */
export interface ITaskin {
  /**
   * Finish a task
   */
  finish(taskId: TaskId, options?: FinishTaskOptions): Promise<void>;

  /**
   * Lint/validate tasks from the configured provider
   */
  lint(options?: LintTasksOptions): Promise<LintResult>;

  /**
   * List all tasks with optional filters
   */
  list(options?: ListTasksOptions): Promise<Task[]>;

  /**
   * Pause work on a task
   */
  pause(taskId: TaskId, options?: PauseTaskOptions): Promise<void>;

  /**
   * Start working on a task
   */
  start(taskId: TaskId, options?: StartTaskOptions): Promise<void>;
}

/**
 * Unique identifier for a task (UUID branded type).
 * Use this type for type-safe task ID handling across the system.
 *
 * @public
 * @example
 * ```ts
 * function getTask(id: TaskId): Task { ... }
 * const taskId: TaskId = '550e8400-e29b-41d4-a716-446655440000' as TaskId;
 * ```
 */
export type TaskId = z.infer<typeof TaskIdSchema>;

/**
 * Status of a task in its lifecycle.
 * Represents the current state of work on a task.
 *
 * @public
 */
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * Type of task based on the kind of work being performed.
 * Follows conventional commit types for consistency across the codebase.
 *
 * @public
 */
export type TaskType = z.infer<typeof TaskTypeSchema>;

/**
 * Represents a task in the Taskin system.
 * Contains all core information needed to track and manage work items.
 *
 * @public
 */
export type Task = z.infer<typeof TaskSchema>;

/**
 * Represents a user in the Taskin system.
 * Contains basic user identification and contact information.
 *
 * @public
 */
export type User = z.infer<typeof UserSchema>;
