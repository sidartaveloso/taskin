"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsQuerySchema = exports.TeamStatsSchema = exports.UserStatsSchema = exports.TaskStatsSchema = exports.EngagementMetricsSchema = exports.ContributionMetricsSchema = exports.TemporalMetricsSchema = exports.RefactoringMetricsSchema = exports.CodeMetricsSchema = exports.GitCommitSchema = exports.CommitSizeSchema = exports.DayOfWeekSchema = exports.TimeOfDaySchema = exports.StatsPeriodSchema = exports.TaskSchema = exports.UserSchema = exports.TaskTypeSchema = exports.TaskStatusSchema = exports.TASK_TYPES = exports.TASK_STATUSES = exports.TaskIdSchema = void 0;
const zod_1 = require("zod");
/**
 * Task identifier schema.
 * Represents a unique identifier for a task (UUID format).
 *
 * @public
 */
exports.TaskIdSchema = zod_1.z.string().uuid().brand('TaskId');
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
exports.TASK_STATUSES = [
    'pending',
    'in-progress',
    'done',
    'blocked',
    'canceled',
];
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
exports.TASK_TYPES = [
    'feat',
    'fix',
    'refactor',
    'docs',
    'test',
    'chore',
];
/**
 * Runtime validator for task status values.
 * Use this to validate user input or external data.
 *
 * @public
 */
exports.TaskStatusSchema = zod_1.z.enum(exports.TASK_STATUSES);
/**
 * Runtime validator for task type values.
 * Use this to validate user input or external data.
 *
 * @public
 */
exports.TaskTypeSchema = zod_1.z.enum(exports.TASK_TYPES);
/**
 * Runtime validator for user objects.
 * Use this to parse and validate user data from external sources.
 *
 * @public
 */
exports.UserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    id: zod_1.z.string(),
    name: zod_1.z.string(),
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
exports.TaskSchema = zod_1.z.object({
    createdAt: zod_1.z.string().datetime(),
    id: exports.TaskIdSchema,
    status: exports.TaskStatusSchema,
    title: zod_1.z.string(),
    type: exports.TaskTypeSchema,
    assignee: exports.UserSchema.optional(),
    completed: zod_1.z.boolean().optional(),
    description: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
});
// ============================================================================
// Stats & Track Record Schemas
// ============================================================================
/**
 * Time period for filtering stats
 * @public
 */
exports.StatsPeriodSchema = zod_1.z.enum([
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
exports.TimeOfDaySchema = zod_1.z.enum([
    'morning',
    'afternoon',
    'evening',
    'night',
]);
/**
 * Day of week (0 = Sunday, 6 = Saturday)
 * @public
 */
exports.DayOfWeekSchema = zod_1.z.number().min(0).max(6);
/**
 * Commit size classification
 * @public
 */
exports.CommitSizeSchema = zod_1.z.enum(['small', 'medium', 'large']);
/**
 * Git commit metadata
 * @public
 */
exports.GitCommitSchema = zod_1.z.object({
    hash: zod_1.z.string(),
    author: zod_1.z.string(),
    date: zod_1.z.preprocess((val) => {
        if (val instanceof Date)
            return val.toISOString();
        return String(val);
    }, zod_1.z.string().datetime()),
    message: zod_1.z.string(),
    filesChanged: zod_1.z.number().int().nonnegative(),
    linesAdded: zod_1.z.coerce.number().int().nonnegative(),
    linesRemoved: zod_1.z.coerce.number().int().nonnegative(),
    coAuthors: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * Code metrics for a commit or period
 * @public
 */
exports.CodeMetricsSchema = zod_1.z.object({
    linesAdded: zod_1.z.coerce.number().int().nonnegative(),
    linesRemoved: zod_1.z.coerce.number().int().nonnegative(),
    netChange: zod_1.z.coerce.number().int(),
    characters: zod_1.z.coerce.number().int().nonnegative(),
    filesChanged: zod_1.z.coerce.number().int().nonnegative(),
    commits: zod_1.z.coerce.number().int().nonnegative(),
});
/**
 * Refactoring quality metrics
 * @public
 */
exports.RefactoringMetricsSchema = zod_1.z.object({
    // simplificationRatio must be > 0 for refactor simplification
    simplificationRatio: zod_1.z.number().positive(),
    linesRemoved: zod_1.z.coerce.number().int().nonnegative(),
    linesAdded: zod_1.z.coerce.number().int().nonnegative(),
    netReduction: zod_1.z.coerce.number().int(),
    reductionPercentage: zod_1.z.coerce.number(),
    quality: zod_1.z.enum(['excellent', 'good', 'neutral', 'expansion']),
});
/**
 * Temporal productivity metrics
 * @public
 */
exports.TemporalMetricsSchema = zod_1.z.object({
    // keys are string '0'-'6'
    byDayOfWeek: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative()),
    // keys are time of day string values: 'morning'|'afternoon'|'evening'|'night'
    byTimeOfDay: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative()),
    streak: zod_1.z.coerce.number().int().nonnegative(),
    trend: zod_1.z.enum(['increasing', 'stable', 'decreasing']),
});
/**
 * Contribution metrics for a user
 * @public
 */
exports.ContributionMetricsSchema = zod_1.z.object({
    totalCommits: zod_1.z.coerce.number().int().nonnegative(),
    tasksCompleted: zod_1.z.coerce.number().int().nonnegative(),
    averageCompletionTime: zod_1.z.coerce.number().nonnegative(), // in days
    // keys are task type strings (e.g. 'feat', 'fix')
    taskTypeDistribution: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative()),
    activityFrequency: zod_1.z.coerce.number().nonnegative(), // commits per day
});
/**
 * Engagement metrics
 * @public
 */
exports.EngagementMetricsSchema = zod_1.z.object({
    commitsPerDay: zod_1.z.coerce.number().nonnegative(),
    consistency: zod_1.z.coerce.number().min(0).max(1), // 0-1 score
    activeTasksCount: zod_1.z.coerce.number().int().nonnegative(),
    completionRate: zod_1.z.coerce.number().min(0).max(1), // percentage as decimal
});
/**
 * Task-specific statistics
 * @public
 */
exports.TaskStatsSchema = zod_1.z.object({
    taskId: exports.TaskIdSchema,
    title: zod_1.z.string(),
    type: exports.TaskTypeSchema,
    status: exports.TaskStatusSchema,
    assignee: zod_1.z.string().optional(),
    duration: zod_1.z.coerce.number().nonnegative(), // in days
    created: zod_1.z.preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime()),
    firstCommit: zod_1.z
        .preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime())
        .optional(),
    lastCommit: zod_1.z
        .preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime())
        .optional(),
    statusChangedToDone: zod_1.z
        .preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime())
        .optional(),
    contributors: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        commits: zod_1.z.coerce.number().int().nonnegative(),
        isCoAuthor: zod_1.z.boolean().optional(),
    })),
    codeMetrics: exports.CodeMetricsSchema,
    refactoringMetrics: exports.RefactoringMetricsSchema.optional(),
    temporalMetrics: exports.TemporalMetricsSchema,
    workPattern: zod_1.z.object({
        mostActiveTimeOfDay: exports.TimeOfDaySchema,
        daysWorked: zod_1.z.number().int().nonnegative(),
        gaps: zod_1.z.number().int().nonnegative(), // days without activity
    }),
    commitHistory: zod_1.z.object({
        totalCommits: zod_1.z.coerce.number().int().nonnegative(),
        averageCommitSize: zod_1.z.coerce.number().nonnegative(),
        largestCommit: zod_1.z.object({
            linesAdded: zod_1.z.coerce.number().int().nonnegative(),
            linesRemoved: zod_1.z.coerce.number().int().nonnegative(),
        }),
        smallestCommit: zod_1.z.object({
            linesAdded: zod_1.z.coerce.number().int().nonnegative(),
            linesRemoved: zod_1.z.coerce.number().int().nonnegative(),
        }),
    }),
});
/**
 * User statistics report
 * @public
 */
exports.UserStatsSchema = zod_1.z.object({
    username: zod_1.z.string(),
    period: exports.StatsPeriodSchema,
    periodStart: zod_1.z.preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime()),
    periodEnd: zod_1.z.preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime()),
    codeMetrics: exports.CodeMetricsSchema,
    temporalMetrics: exports.TemporalMetricsSchema,
    contributionMetrics: exports.ContributionMetricsSchema,
    engagementMetrics: exports.EngagementMetricsSchema,
    refactoringMetrics: exports.RefactoringMetricsSchema.optional(),
    topTasks: zod_1.z
        .array(zod_1.z.object({
        taskId: exports.TaskIdSchema,
        title: zod_1.z.string(),
        commits: zod_1.z.coerce.number().int().nonnegative(),
    }))
        .max(10),
});
/**
 * Team statistics report
 * @public
 */
exports.TeamStatsSchema = zod_1.z.object({
    period: exports.StatsPeriodSchema,
    periodStart: zod_1.z.preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime()),
    periodEnd: zod_1.z.preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), zod_1.z.string().datetime()),
    totalContributors: zod_1.z.number().int().nonnegative(),
    totalCommits: zod_1.z.number().int().nonnegative(),
    totalTasksCompleted: zod_1.z.number().int().nonnegative(),
    codeMetrics: exports.CodeMetricsSchema,
    contributors: zod_1.z.array(zod_1.z.object({
        username: zod_1.z.string(),
        commits: zod_1.z.coerce.number().int().nonnegative(),
        tasksCompleted: zod_1.z.coerce.number().int().nonnegative(),
        codeMetrics: exports.CodeMetricsSchema,
    })),
    taskTypeDistribution: zod_1.z.record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative()),
});
/**
 * Statistics query parameters
 * @public
 */
exports.StatsQuerySchema = zod_1.z.object({
    period: exports.StatsPeriodSchema.optional(),
    user: zod_1.z.string().optional(),
    taskId: exports.TaskIdSchema.optional(),
    detailed: zod_1.z.boolean().optional(),
    format: zod_1.z.enum(['text', 'json', 'html']).optional(),
});
//# sourceMappingURL=taskin.schemas.js.map