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
  'canceled',
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
 * Runtime validator for user objects.
 * Use this to parse and validate user data from external sources.
 *
 * @public
 */
export const UserSchema = z.object({
  email: z.string().email(),
  id: z.string(),
  name: z.string(),
});

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
  assignee: UserSchema.optional(),
  completed: z.boolean().optional(),
  description: z.string().optional(),
  userId: z.string().optional(),
});

// ============================================================================
// Stats & Track Record Schemas
// ============================================================================

/**
 * Time period for filtering stats
 * @public
 */
export const StatsPeriodSchema = z.enum([
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'all',
]);

/**
 * Time of day categories for productivity analysis
 * @public
 */
export const TimeOfDaySchema = z.enum([
  'morning',
  'afternoon',
  'evening',
  'night',
]);

/**
 * Day of week (0 = Sunday, 6 = Saturday)
 * @public
 */
export const DayOfWeekSchema = z.number().min(0).max(6);

/**
 * Commit size classification
 * @public
 */
export const CommitSizeSchema = z.enum(['small', 'medium', 'large']);

/**
 * Git commit metadata
 * @public
 */
export const GitCommitSchema = z.object({
  hash: z.string(),
  author: z.string(),
  date: z.string().datetime(),
  message: z.string(),
  filesChanged: z.number().int().nonnegative(),
  linesAdded: z.number().int().nonnegative(),
  linesRemoved: z.number().int().nonnegative(),
  coAuthors: z.array(z.string()).optional(),
});

/**
 * Code metrics for a commit or period
 * @public
 */
export const CodeMetricsSchema = z.object({
  linesAdded: z.number().int().nonnegative(),
  linesRemoved: z.number().int().nonnegative(),
  netChange: z.number().int(),
  characters: z.number().int().nonnegative(),
  filesChanged: z.number().int().nonnegative(),
  commits: z.number().int().nonnegative(),
});

/**
 * Refactoring quality metrics
 * @public
 */
export const RefactoringMetricsSchema = z.object({
  simplificationRatio: z.number().positive(),
  linesRemoved: z.number().int().nonnegative(),
  linesAdded: z.number().int().nonnegative(),
  netReduction: z.number().int(),
  reductionPercentage: z.number(),
  quality: z.enum(['excellent', 'good', 'neutral', 'expansion']),
});

/**
 * Temporal productivity metrics
 * @public
 */
export const TemporalMetricsSchema = z.object({
  byDayOfWeek: z.record(z.string(), z.number().int().nonnegative()), // keys are string '0'-'6'
  byTimeOfDay: z.record(TimeOfDaySchema, z.number().int().nonnegative()),
  streak: z.number().int().nonnegative(),
  trend: z.enum(['increasing', 'stable', 'decreasing']),
});

/**
 * Contribution metrics for a user
 * @public
 */
export const ContributionMetricsSchema = z.object({
  totalCommits: z.number().int().nonnegative(),
  tasksCompleted: z.number().int().nonnegative(),
  averageCompletionTime: z.number().nonnegative(), // in days
  taskTypeDistribution: z.record(
    TaskTypeSchema,
    z.number().int().nonnegative(),
  ),
  activityFrequency: z.number().nonnegative(), // commits per day
});

/**
 * Engagement metrics
 * @public
 */
export const EngagementMetricsSchema = z.object({
  commitsPerDay: z.number().nonnegative(),
  consistency: z.number().min(0).max(1), // 0-1 score
  activeTasksCount: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1), // percentage as decimal
});

/**
 * Task-specific statistics
 * @public
 */
export const TaskStatsSchema = z.object({
  taskId: TaskIdSchema,
  title: z.string(),
  type: TaskTypeSchema,
  status: TaskStatusSchema,
  assignee: z.string().optional(),
  duration: z.number().nonnegative(), // in days
  created: z.string().datetime(),
  firstCommit: z.string().datetime().optional(),
  lastCommit: z.string().datetime().optional(),
  statusChangedToDone: z.string().datetime().optional(),
  contributors: z.array(
    z.object({
      name: z.string(),
      commits: z.number().int().nonnegative(),
      isCoAuthor: z.boolean().optional(),
    }),
  ),
  codeMetrics: CodeMetricsSchema,
  refactoringMetrics: RefactoringMetricsSchema.optional(),
  temporalMetrics: TemporalMetricsSchema,
  workPattern: z.object({
    mostActiveTimeOfDay: TimeOfDaySchema,
    daysWorked: z.number().int().nonnegative(),
    gaps: z.number().int().nonnegative(), // days without activity
  }),
  commitHistory: z.object({
    totalCommits: z.number().int().nonnegative(),
    averageCommitSize: z.number().nonnegative(),
    largestCommit: z.object({
      linesAdded: z.number().int().nonnegative(),
      linesRemoved: z.number().int().nonnegative(),
    }),
    smallestCommit: z.object({
      linesAdded: z.number().int().nonnegative(),
      linesRemoved: z.number().int().nonnegative(),
    }),
  }),
});

/**
 * User statistics report
 * @public
 */
export const UserStatsSchema = z.object({
  username: z.string(),
  period: StatsPeriodSchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  codeMetrics: CodeMetricsSchema,
  temporalMetrics: TemporalMetricsSchema,
  contributionMetrics: ContributionMetricsSchema,
  engagementMetrics: EngagementMetricsSchema,
  refactoringMetrics: RefactoringMetricsSchema.optional(),
  topTasks: z
    .array(
      z.object({
        taskId: TaskIdSchema,
        title: z.string(),
        commits: z.number().int().nonnegative(),
      }),
    )
    .max(10),
});

/**
 * Team statistics report
 * @public
 */
export const TeamStatsSchema = z.object({
  period: StatsPeriodSchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  totalContributors: z.number().int().nonnegative(),
  totalCommits: z.number().int().nonnegative(),
  totalTasksCompleted: z.number().int().nonnegative(),
  codeMetrics: CodeMetricsSchema,
  contributors: z.array(
    z.object({
      username: z.string(),
      commits: z.number().int().nonnegative(),
      tasksCompleted: z.number().int().nonnegative(),
      codeMetrics: CodeMetricsSchema,
    }),
  ),
  taskTypeDistribution: z.record(
    TaskTypeSchema,
    z.number().int().nonnegative(),
  ),
});

/**
 * Statistics query parameters
 * @public
 */
export const StatsQuerySchema = z.object({
  period: StatsPeriodSchema.optional(),
  user: z.string().optional(),
  taskId: TaskIdSchema.optional(),
  detailed: z.boolean().optional(),
  format: z.enum(['text', 'json', 'html']).optional(),
});
