import { z } from 'zod';

/**
 * Task identifier schema.
 * Represents a unique identifier for a task (UUID format).
 *
 * @public
 */
export const TaskIdSchema = z.string().uuid().brand('TaskId');

/**
 * All possible task status values.
 * Use this for runtime operations like iteration, mapping, or validation.
 *
 * @public
 * @example
 * ```ts
 * // Check if a value is a valid status
 * const isValid = TASK_STATUSES.includes(userInput);
 *
 * // Iterate over all statuses
 * TASK_STATUSES.forEach(status => console.log(status));
 * ```
 */
export const TASK_STATUSES = [
  'pending',
  'in-progress',
  'done',
  'blocked',
] as const;

/**
 * All possible task type values.
 * Use this for runtime operations like iteration, mapping, or validation.
 *
 * @public
 * @example
 * ```ts
 * // Generate a dropdown menu
 * const options = TASK_TYPES.map(type => ({ value: type, label: type }));
 * ```
 */
export const TASK_TYPES = [
  'feat',
  'fix',
  'refactor',
  'docs',
  'test',
  'chore',
] as const;

/**
 * Runtime validator for task status values.
 * Use this to validate user input or external data.
 *
 * @public
 */
export const TaskStatusSchema = z.enum(TASK_STATUSES);

/**
 * Runtime validator for task type values.
 * Use this to validate user input or external data.
 *
 * @public
 */
export const TaskTypeSchema = z.enum(TASK_TYPES);

/**
 * Runtime validator for task objects.
 * Use this to parse and validate task data from external sources (API, database, forms).
 *
 * @public
 * @example
 * ```ts
 * // Parse and validate task data
 * const task = TaskSchema.parse(userInput);
 *
 * // Safe parse with error handling
 * const result = TaskSchema.safeParse(untrustedData);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export const TaskSchema = z.object({
  createdAt: z.string().datetime(),
  id: TaskIdSchema,
  status: TaskStatusSchema,
  title: z.string(),
  type: TaskTypeSchema,
  assignee: z.string().optional(),
  completed: z.boolean().optional(),
  description: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * Runtime validator for user objects.
 * Use this to parse and validate user data from external sources.
 *
 * @public
 */
export const UserSchema = z.object({
  email: z.string().email(),
  id: z.string().uuid(),
  name: z.string(),
});
