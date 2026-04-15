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
  'in-review',
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
  date: z.preprocess((val) => {
    if (val instanceof Date) return val.toISOString();
    return String(val);
  }, z.string().datetime()),
  message: z.string(),
  filesChanged: z.number().int().nonnegative(),
  // Using z.coerce for git output (strings like "123") -> numbers
  // This is intentional for parsing external data sources
  linesAdded: z.coerce.number().int().nonnegative(),
  linesRemoved: z.coerce.number().int().nonnegative(),
  coAuthors: z.array(z.string()).optional(),
});

/**
 * Code metrics for a commit or period
 * Uses z.coerce to handle external data sources (Git output, API responses)
 * that may provide numbers as strings
 * @public
 */
export const CodeMetricsSchema = z.object({
  linesAdded: z.coerce.number().int().nonnegative(),
  linesRemoved: z.coerce.number().int().nonnegative(),
  netChange: z.coerce.number().int(),
  characters: z.coerce.number().int().nonnegative(),
  filesChanged: z.coerce.number().int().nonnegative(),
  commits: z.coerce.number().int().nonnegative(),
});

/**
 * Refactoring quality metrics
 * @public
 */
export const RefactoringMetricsSchema = z.object({
  // simplificationRatio must be > 0 for refactor simplification
  simplificationRatio: z.number().positive(),
  linesRemoved: z.coerce.number().int().nonnegative(),
  linesAdded: z.coerce.number().int().nonnegative(),
  netReduction: z.coerce.number().int(),
  reductionPercentage: z.coerce.number(),
  quality: z.enum(['excellent', 'good', 'neutral', 'expansion']),
});

/**
 * Temporal productivity metrics
 * @public
 */
export const TemporalMetricsSchema = z.object({
  // keys are string '0'-'6'
  byDayOfWeek: z.record(z.string(), z.coerce.number().int().nonnegative()),
  // keys are time of day string values: 'morning'|'afternoon'|'evening'|'night'
  byTimeOfDay: z.record(z.string(), z.coerce.number().int().nonnegative()),
  streak: z.coerce.number().int().nonnegative(),
  trend: z.enum(['increasing', 'stable', 'decreasing']),
});

/**
 * Contribution metrics for a user
 * @public
 */
export const ContributionMetricsSchema = z.object({
  totalCommits: z.coerce.number().int().nonnegative(),
  tasksCompleted: z.coerce.number().int().nonnegative(),
  averageCompletionTime: z.coerce.number().nonnegative(), // in days
  // keys are task type strings (e.g. 'feat', 'fix')
  taskTypeDistribution: z.record(
    z.string(),
    z.coerce.number().int().nonnegative(),
  ),
  activityFrequency: z.coerce.number().nonnegative(), // commits per day
});

/**
 * Engagement metrics
 * @public
 */
export const EngagementMetricsSchema = z.object({
  commitsPerDay: z.coerce.number().nonnegative(),
  consistency: z.coerce.number().min(0).max(1), // 0-1 score
  activeTasksCount: z.coerce.number().int().nonnegative(),
  completionRate: z.coerce.number().min(0).max(1), // percentage as decimal
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
  duration: z.coerce.number().nonnegative(), // in days
  created: z.preprocess(
    (v) => (v instanceof Date ? v.toISOString() : String(v)),
    z.string().datetime(),
  ),
  firstCommit: z
    .preprocess(
      (v) => (v instanceof Date ? v.toISOString() : String(v)),
      z.string().datetime(),
    )
    .optional(),
  lastCommit: z
    .preprocess(
      (v) => (v instanceof Date ? v.toISOString() : String(v)),
      z.string().datetime(),
    )
    .optional(),
  statusChangedToDone: z
    .preprocess(
      (v) => (v instanceof Date ? v.toISOString() : String(v)),
      z.string().datetime(),
    )
    .optional(),
  contributors: z.array(
    z.object({
      name: z.string(),
      commits: z.coerce.number().int().nonnegative(),
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
    totalCommits: z.coerce.number().int().nonnegative(),
    averageCommitSize: z.coerce.number().nonnegative(),
    largestCommit: z.object({
      linesAdded: z.coerce.number().int().nonnegative(),
      linesRemoved: z.coerce.number().int().nonnegative(),
    }),
    smallestCommit: z.object({
      linesAdded: z.coerce.number().int().nonnegative(),
      linesRemoved: z.coerce.number().int().nonnegative(),
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
  periodStart: z.preprocess(
    (v) => (v instanceof Date ? v.toISOString() : String(v)),
    z.string().datetime(),
  ),
  periodEnd: z.preprocess(
    (v) => (v instanceof Date ? v.toISOString() : String(v)),
    z.string().datetime(),
  ),
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
        commits: z.coerce.number().int().nonnegative(),
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
  periodStart: z.preprocess(
    (v) => (v instanceof Date ? v.toISOString() : String(v)),
    z.string().datetime(),
  ),
  periodEnd: z.preprocess(
    (v) => (v instanceof Date ? v.toISOString() : String(v)),
    z.string().datetime(),
  ),
  totalContributors: z.number().int().nonnegative(),
  totalCommits: z.number().int().nonnegative(),
  totalTasksCompleted: z.number().int().nonnegative(),
  codeMetrics: CodeMetricsSchema,
  contributors: z.array(
    z.object({
      username: z.string(),
      commits: z.coerce.number().int().nonnegative(),
      tasksCompleted: z.coerce.number().int().nonnegative(),
      codeMetrics: CodeMetricsSchema,
    }),
  ),
  taskTypeDistribution: z.record(
    z.string(),
    z.coerce.number().int().nonnegative(),
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

/**
 * Automation level for Taskin operations.
 * Defines how much Taskin automates git operations.
 *
 * @public
 * @example
 * ```ts
 * // Manual: Full user control, only suggestions
 * level: 'manual'
 *
 * // Assisted: Auto-commit metadata, suggest work commits
 * level: 'assisted'
 *
 * // Autopilot: Auto-commit everything
 * level: 'autopilot'
 * ```
 */
export const AutomationLevelSchema = z.enum([
  'manual',
  'assisted',
  'autopilot',
]);

/**
 * Granular commit automation settings.
 * Allows fine-grained control over what gets auto-committed.
 *
 * @public
 */
export const CommitAutomationSchema = z.object({
  /** Auto-commit task status changes (e.g., pending → in-progress) */
  taskStatusChanges: z.boolean().default(true),
  /** Auto-commit work-in-progress saves (pause command) */
  workInProgress: z.boolean().default(true),
  /** Auto-commit completed work (finish command) */
  completedWork: z.boolean().default(false),
});

/**
 * Automation configuration schema.
 * Controls how Taskin automates git operations.
 *
 * @public
 */
export const AutomationConfigSchema = z.object({
  /** Preset automation level */
  level: AutomationLevelSchema.default('assisted'),
  /** Granular commit settings (overrides level if provided) */
  commits: CommitAutomationSchema.optional(),
  /** Default branch for task commits (e.g., 'main', 'develop'). When set, autocommits will always commit to this branch regardless of current branch. */
  defaultBranch: z.string().optional(),
});

/**
 * Provider configuration schema.
 * Defines which task provider to use and its settings.
 *
 * @public
 */
export const ProviderConfigSchema = z.object({
  type: z.string(),
  config: z.record(z.unknown()),
});

/**
 * Command names for lifecycle hooks.
 * Use this for runtime validation and type narrowing.
 *
 * @public
 * @example
 * ```ts
 * const isValidCommand = HOOK_COMMANDS.includes(userInput);
 * ```
 */
export const HOOK_COMMANDS = ['start', 'pause', 'finish', 'review'] as const;

/**
 * Hook phase (when the hook runs relative to command execution).
 *
 * @public
 */
export const HOOK_PHASES = ['pre', 'during', 'post'] as const;

/**
 * Command hooks schema - hooks for a single command.
 * Each phase is optional and contains shell commands to execute.
 *
 * @public
 * @example
 * ```ts
 * const reviewHooks: CommandHooks = {
 *   pre: ['git fetch', 'git merge origin/main'],
 *   during: ['pnpm lint', 'pnpm test'],
 *   post: ['git push']
 * };
 * ```
 */
export const CommandHooksSchema = z.object({
  /** Hooks executed before command logic */
  pre: z.array(z.string()).optional(),
  /** Hooks executed during command logic */
  during: z.array(z.string()).optional(),
  /** Hooks executed after command succeeds */
  post: z.array(z.string()).optional(),
});

/**
 * Global hook configuration for all commands.
 *
 * @public
 */
export const HookConfigSchema = z.object({
  /** Hooks for start command */
  start: CommandHooksSchema.optional(),
  /** Hooks for pause command */
  pause: CommandHooksSchema.optional(),
  /** Hooks for finish command */
  finish: CommandHooksSchema.optional(),
  /** Hooks for review command */
  review: CommandHooksSchema.optional(),
});

/**
 * Global hook execution settings.
 *
 * @public
 */
export const HookSettingsSchema = z.object({
  /** Base branch for git operations */
  baseBranch: z.string().default('main'),
  /** Continue on error */
  continueOnError: z.boolean().default(false),
  /** Timeout in milliseconds */
  timeout: z.number().int().positive().default(300000),
  /** Working directory */
  cwd: z.string().optional(),
});

/**
 * Hook execution context with template variables.
 *
 * @public
 * @example
 * ```ts
 * const context: HookContext = {
 *   taskId: '014',
 *   taskTitle: 'Add review command',
 *   baseBranch: 'develop'
 * };
 * // Hook: "git checkout -b feat/task-{{taskId}}"
 * // Executes: "git checkout -b feat/task-014"
 * ```
 */
export const HookContextSchema = z
  .object({
    /** Task ID (normalized) */
    taskId: z.string(),
    /** Task title for commit messages */
    taskTitle: z.string(),
    /** Base branch for merge operations */
    baseBranch: z.string().optional(),
  })
  .catchall(z.string().optional());

/**
 * Options for hook execution.
 *
 * @public
 */
export const HookOptionsSchema = z.object({
  /** Timeout in milliseconds */
  timeout: z.number().int().positive(),
  /** Continue executing remaining hooks if one fails */
  continueOnError: z.boolean(),
  /** Working directory for command execution */
  cwd: z.string(),
});

/**
 * Result of a single hook execution.
 *
 * @public
 */
export const HookResultSchema = z.object({
  /** The hook command that was executed */
  hook: z.string(),
  /** Whether the hook succeeded */
  success: z.boolean(),
  /** Combined stdout/stderr output */
  output: z.string().optional(),
  /** Error message if failed */
  error: z.string().optional(),
  /** Execution duration in milliseconds */
  duration: z.number().int().nonnegative(),
});

/**
 * Taskin configuration file schema (.taskin.json).
 * Root configuration for a Taskin project.
 *
 * @public
 */
export const TaskinConfigSchema = z.object({
  version: z.string(),
  automation: AutomationConfigSchema.optional(),
  provider: ProviderConfigSchema,
  /** Unified hook system for all commands */
  hooks: HookConfigSchema.optional(),
  /** Global hook execution settings */
  hookConfig: HookSettingsSchema.optional(),
});
