import type { z } from 'zod';
import type {
  TaskSchema,
  TaskStatusSchema,
  TaskTypeSchema,
  UserSchema,
} from './types-ts.schemas';

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
