import { z } from 'zod';
/**
 * Task identifier schema.
 * Represents a unique identifier for a task (UUID format).
 *
 * @public
 */
export declare const TaskIdSchema: z.ZodBranded<z.ZodString, "TaskId">;
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
export declare const TASK_STATUSES: readonly ["pending", "in-progress", "done", "blocked", "canceled"];
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
export declare const TASK_TYPES: readonly ["feat", "fix", "refactor", "docs", "test", "chore"];
/**
 * Runtime validator for task status values.
 * Use this to validate user input or external data.
 *
 * @public
 */
export declare const TaskStatusSchema: z.ZodEnum<["pending", "in-progress", "done", "blocked", "canceled"]>;
/**
 * Runtime validator for task type values.
 * Use this to validate user input or external data.
 *
 * @public
 */
export declare const TaskTypeSchema: z.ZodEnum<["feat", "fix", "refactor", "docs", "test", "chore"]>;
/**
 * Runtime validator for user objects.
 * Use this to parse and validate user data from external sources.
 *
 * @public
 */
export declare const UserSchema: z.ZodObject<{
    email: z.ZodString;
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    name: string;
}, {
    email: string;
    id: string;
    name: string;
}>;
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
export declare const TaskSchema: z.ZodObject<{
    createdAt: z.ZodString;
    id: z.ZodBranded<z.ZodString, "TaskId">;
    status: z.ZodEnum<["pending", "in-progress", "done", "blocked", "canceled"]>;
    title: z.ZodString;
    type: z.ZodEnum<["feat", "fix", "refactor", "docs", "test", "chore"]>;
    assignee: z.ZodOptional<z.ZodObject<{
        email: z.ZodString;
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        name: string;
    }, {
        email: string;
        id: string;
        name: string;
    }>>;
    completed: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string & z.BRAND<"TaskId">;
    type: "feat" | "fix" | "refactor" | "docs" | "test" | "chore";
    status: "pending" | "in-progress" | "done" | "blocked" | "canceled";
    createdAt: string;
    title: string;
    assignee?: {
        email: string;
        id: string;
        name: string;
    } | undefined;
    completed?: boolean | undefined;
    description?: string | undefined;
    userId?: string | undefined;
}, {
    id: string;
    type: "feat" | "fix" | "refactor" | "docs" | "test" | "chore";
    status: "pending" | "in-progress" | "done" | "blocked" | "canceled";
    createdAt: string;
    title: string;
    assignee?: {
        email: string;
        id: string;
        name: string;
    } | undefined;
    completed?: boolean | undefined;
    description?: string | undefined;
    userId?: string | undefined;
}>;
/**
 * Time period for filtering stats
 * @public
 */
export declare const StatsPeriodSchema: z.ZodEnum<["day", "week", "month", "quarter", "year", "all"]>;
/**
 * Time of day categories for productivity analysis
 * @public
 */
export declare const TimeOfDaySchema: z.ZodEnum<["morning", "afternoon", "evening", "night"]>;
/**
 * Day of week (0 = Sunday, 6 = Saturday)
 * @public
 */
export declare const DayOfWeekSchema: z.ZodNumber;
/**
 * Commit size classification
 * @public
 */
export declare const CommitSizeSchema: z.ZodEnum<["small", "medium", "large"]>;
/**
 * Git commit metadata
 * @public
 */
export declare const GitCommitSchema: z.ZodObject<{
    hash: z.ZodString;
    author: z.ZodString;
    date: z.ZodEffects<z.ZodString, string, unknown>;
    message: z.ZodString;
    filesChanged: z.ZodNumber;
    linesAdded: z.ZodNumber;
    linesRemoved: z.ZodNumber;
    coAuthors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    hash: string;
    author: string;
    date: string;
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    coAuthors?: string[] | undefined;
}, {
    message: string;
    hash: string;
    author: string;
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    date?: unknown;
    coAuthors?: string[] | undefined;
}>;
/**
 * Code metrics for a commit or period
 * @public
 */
export declare const CodeMetricsSchema: z.ZodObject<{
    linesAdded: z.ZodNumber;
    linesRemoved: z.ZodNumber;
    netChange: z.ZodNumber;
    characters: z.ZodNumber;
    filesChanged: z.ZodNumber;
    commits: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    netChange: number;
    characters: number;
    commits: number;
}, {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    netChange: number;
    characters: number;
    commits: number;
}>;
/**
 * Refactoring quality metrics
 * @public
 */
export declare const RefactoringMetricsSchema: z.ZodObject<{
    simplificationRatio: z.ZodNumber;
    linesRemoved: z.ZodNumber;
    linesAdded: z.ZodNumber;
    netReduction: z.ZodNumber;
    reductionPercentage: z.ZodNumber;
    quality: z.ZodEnum<["excellent", "good", "neutral", "expansion"]>;
}, "strip", z.ZodTypeAny, {
    linesAdded: number;
    linesRemoved: number;
    simplificationRatio: number;
    netReduction: number;
    reductionPercentage: number;
    quality: "excellent" | "good" | "neutral" | "expansion";
}, {
    linesAdded: number;
    linesRemoved: number;
    simplificationRatio: number;
    netReduction: number;
    reductionPercentage: number;
    quality: "excellent" | "good" | "neutral" | "expansion";
}>;
/**
 * Temporal productivity metrics
 * @public
 */
export declare const TemporalMetricsSchema: z.ZodObject<{
    byDayOfWeek: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byTimeOfDay: z.ZodRecord<z.ZodString, z.ZodNumber>;
    streak: z.ZodNumber;
    trend: z.ZodEnum<["increasing", "stable", "decreasing"]>;
}, "strip", z.ZodTypeAny, {
    byDayOfWeek: Record<string, number>;
    byTimeOfDay: Record<string, number>;
    streak: number;
    trend: "increasing" | "stable" | "decreasing";
}, {
    byDayOfWeek: Record<string, number>;
    byTimeOfDay: Record<string, number>;
    streak: number;
    trend: "increasing" | "stable" | "decreasing";
}>;
/**
 * Contribution metrics for a user
 * @public
 */
export declare const ContributionMetricsSchema: z.ZodObject<{
    totalCommits: z.ZodNumber;
    tasksCompleted: z.ZodNumber;
    averageCompletionTime: z.ZodNumber;
    taskTypeDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    activityFrequency: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalCommits: number;
    tasksCompleted: number;
    averageCompletionTime: number;
    taskTypeDistribution: Record<string, number>;
    activityFrequency: number;
}, {
    totalCommits: number;
    tasksCompleted: number;
    averageCompletionTime: number;
    taskTypeDistribution: Record<string, number>;
    activityFrequency: number;
}>;
/**
 * Engagement metrics
 * @public
 */
export declare const EngagementMetricsSchema: z.ZodObject<{
    commitsPerDay: z.ZodNumber;
    consistency: z.ZodNumber;
    activeTasksCount: z.ZodNumber;
    completionRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    commitsPerDay: number;
    consistency: number;
    activeTasksCount: number;
    completionRate: number;
}, {
    commitsPerDay: number;
    consistency: number;
    activeTasksCount: number;
    completionRate: number;
}>;
/**
 * Task-specific statistics
 * @public
 */
export declare const TaskStatsSchema: z.ZodObject<{
    taskId: z.ZodBranded<z.ZodString, "TaskId">;
    title: z.ZodString;
    type: z.ZodEnum<["feat", "fix", "refactor", "docs", "test", "chore"]>;
    status: z.ZodEnum<["pending", "in-progress", "done", "blocked", "canceled"]>;
    assignee: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    created: z.ZodEffects<z.ZodString, string, unknown>;
    firstCommit: z.ZodOptional<z.ZodEffects<z.ZodString, string, unknown>>;
    lastCommit: z.ZodOptional<z.ZodEffects<z.ZodString, string, unknown>>;
    statusChangedToDone: z.ZodOptional<z.ZodEffects<z.ZodString, string, unknown>>;
    contributors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        commits: z.ZodNumber;
        isCoAuthor: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        commits: number;
        isCoAuthor?: boolean | undefined;
    }, {
        name: string;
        commits: number;
        isCoAuthor?: boolean | undefined;
    }>, "many">;
    codeMetrics: z.ZodObject<{
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        netChange: z.ZodNumber;
        characters: z.ZodNumber;
        filesChanged: z.ZodNumber;
        commits: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }>;
    refactoringMetrics: z.ZodOptional<z.ZodObject<{
        simplificationRatio: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        linesAdded: z.ZodNumber;
        netReduction: z.ZodNumber;
        reductionPercentage: z.ZodNumber;
        quality: z.ZodEnum<["excellent", "good", "neutral", "expansion"]>;
    }, "strip", z.ZodTypeAny, {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    }, {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    }>>;
    temporalMetrics: z.ZodObject<{
        byDayOfWeek: z.ZodRecord<z.ZodString, z.ZodNumber>;
        byTimeOfDay: z.ZodRecord<z.ZodString, z.ZodNumber>;
        streak: z.ZodNumber;
        trend: z.ZodEnum<["increasing", "stable", "decreasing"]>;
    }, "strip", z.ZodTypeAny, {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    }, {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    }>;
    workPattern: z.ZodObject<{
        mostActiveTimeOfDay: z.ZodEnum<["morning", "afternoon", "evening", "night"]>;
        daysWorked: z.ZodNumber;
        gaps: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        mostActiveTimeOfDay: "morning" | "afternoon" | "evening" | "night";
        daysWorked: number;
        gaps: number;
    }, {
        mostActiveTimeOfDay: "morning" | "afternoon" | "evening" | "night";
        daysWorked: number;
        gaps: number;
    }>;
    commitHistory: z.ZodObject<{
        totalCommits: z.ZodNumber;
        averageCommitSize: z.ZodNumber;
        largestCommit: z.ZodObject<{
            linesAdded: z.ZodNumber;
            linesRemoved: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            linesAdded: number;
            linesRemoved: number;
        }, {
            linesAdded: number;
            linesRemoved: number;
        }>;
        smallestCommit: z.ZodObject<{
            linesAdded: z.ZodNumber;
            linesRemoved: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            linesAdded: number;
            linesRemoved: number;
        }, {
            linesAdded: number;
            linesRemoved: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        totalCommits: number;
        averageCommitSize: number;
        largestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
        smallestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
    }, {
        totalCommits: number;
        averageCommitSize: number;
        largestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
        smallestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    type: "feat" | "fix" | "refactor" | "docs" | "test" | "chore";
    status: "pending" | "in-progress" | "done" | "blocked" | "canceled";
    title: string;
    taskId: string & z.BRAND<"TaskId">;
    duration: number;
    created: string;
    contributors: {
        name: string;
        commits: number;
        isCoAuthor?: boolean | undefined;
    }[];
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    temporalMetrics: {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    };
    workPattern: {
        mostActiveTimeOfDay: "morning" | "afternoon" | "evening" | "night";
        daysWorked: number;
        gaps: number;
    };
    commitHistory: {
        totalCommits: number;
        averageCommitSize: number;
        largestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
        smallestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
    };
    assignee?: string | undefined;
    firstCommit?: string | undefined;
    lastCommit?: string | undefined;
    statusChangedToDone?: string | undefined;
    refactoringMetrics?: {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    } | undefined;
}, {
    type: "feat" | "fix" | "refactor" | "docs" | "test" | "chore";
    status: "pending" | "in-progress" | "done" | "blocked" | "canceled";
    title: string;
    taskId: string;
    duration: number;
    contributors: {
        name: string;
        commits: number;
        isCoAuthor?: boolean | undefined;
    }[];
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    temporalMetrics: {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    };
    workPattern: {
        mostActiveTimeOfDay: "morning" | "afternoon" | "evening" | "night";
        daysWorked: number;
        gaps: number;
    };
    commitHistory: {
        totalCommits: number;
        averageCommitSize: number;
        largestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
        smallestCommit: {
            linesAdded: number;
            linesRemoved: number;
        };
    };
    assignee?: string | undefined;
    created?: unknown;
    firstCommit?: unknown;
    lastCommit?: unknown;
    statusChangedToDone?: unknown;
    refactoringMetrics?: {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    } | undefined;
}>;
/**
 * User statistics report
 * @public
 */
export declare const UserStatsSchema: z.ZodObject<{
    username: z.ZodString;
    period: z.ZodEnum<["day", "week", "month", "quarter", "year", "all"]>;
    periodStart: z.ZodEffects<z.ZodString, string, unknown>;
    periodEnd: z.ZodEffects<z.ZodString, string, unknown>;
    codeMetrics: z.ZodObject<{
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        netChange: z.ZodNumber;
        characters: z.ZodNumber;
        filesChanged: z.ZodNumber;
        commits: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }>;
    temporalMetrics: z.ZodObject<{
        byDayOfWeek: z.ZodRecord<z.ZodString, z.ZodNumber>;
        byTimeOfDay: z.ZodRecord<z.ZodString, z.ZodNumber>;
        streak: z.ZodNumber;
        trend: z.ZodEnum<["increasing", "stable", "decreasing"]>;
    }, "strip", z.ZodTypeAny, {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    }, {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    }>;
    contributionMetrics: z.ZodObject<{
        totalCommits: z.ZodNumber;
        tasksCompleted: z.ZodNumber;
        averageCompletionTime: z.ZodNumber;
        taskTypeDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
        activityFrequency: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        totalCommits: number;
        tasksCompleted: number;
        averageCompletionTime: number;
        taskTypeDistribution: Record<string, number>;
        activityFrequency: number;
    }, {
        totalCommits: number;
        tasksCompleted: number;
        averageCompletionTime: number;
        taskTypeDistribution: Record<string, number>;
        activityFrequency: number;
    }>;
    engagementMetrics: z.ZodObject<{
        commitsPerDay: z.ZodNumber;
        consistency: z.ZodNumber;
        activeTasksCount: z.ZodNumber;
        completionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        commitsPerDay: number;
        consistency: number;
        activeTasksCount: number;
        completionRate: number;
    }, {
        commitsPerDay: number;
        consistency: number;
        activeTasksCount: number;
        completionRate: number;
    }>;
    refactoringMetrics: z.ZodOptional<z.ZodObject<{
        simplificationRatio: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        linesAdded: z.ZodNumber;
        netReduction: z.ZodNumber;
        reductionPercentage: z.ZodNumber;
        quality: z.ZodEnum<["excellent", "good", "neutral", "expansion"]>;
    }, "strip", z.ZodTypeAny, {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    }, {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    }>>;
    topTasks: z.ZodArray<z.ZodObject<{
        taskId: z.ZodBranded<z.ZodString, "TaskId">;
        title: z.ZodString;
        commits: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        title: string;
        commits: number;
        taskId: string & z.BRAND<"TaskId">;
    }, {
        title: string;
        commits: number;
        taskId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    temporalMetrics: {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    };
    username: string;
    period: "day" | "week" | "month" | "quarter" | "year" | "all";
    periodStart: string;
    periodEnd: string;
    contributionMetrics: {
        totalCommits: number;
        tasksCompleted: number;
        averageCompletionTime: number;
        taskTypeDistribution: Record<string, number>;
        activityFrequency: number;
    };
    engagementMetrics: {
        commitsPerDay: number;
        consistency: number;
        activeTasksCount: number;
        completionRate: number;
    };
    topTasks: {
        title: string;
        commits: number;
        taskId: string & z.BRAND<"TaskId">;
    }[];
    refactoringMetrics?: {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    } | undefined;
}, {
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    temporalMetrics: {
        byDayOfWeek: Record<string, number>;
        byTimeOfDay: Record<string, number>;
        streak: number;
        trend: "increasing" | "stable" | "decreasing";
    };
    username: string;
    period: "day" | "week" | "month" | "quarter" | "year" | "all";
    contributionMetrics: {
        totalCommits: number;
        tasksCompleted: number;
        averageCompletionTime: number;
        taskTypeDistribution: Record<string, number>;
        activityFrequency: number;
    };
    engagementMetrics: {
        commitsPerDay: number;
        consistency: number;
        activeTasksCount: number;
        completionRate: number;
    };
    topTasks: {
        title: string;
        commits: number;
        taskId: string;
    }[];
    refactoringMetrics?: {
        linesAdded: number;
        linesRemoved: number;
        simplificationRatio: number;
        netReduction: number;
        reductionPercentage: number;
        quality: "excellent" | "good" | "neutral" | "expansion";
    } | undefined;
    periodStart?: unknown;
    periodEnd?: unknown;
}>;
/**
 * Team statistics report
 * @public
 */
export declare const TeamStatsSchema: z.ZodObject<{
    period: z.ZodEnum<["day", "week", "month", "quarter", "year", "all"]>;
    periodStart: z.ZodEffects<z.ZodString, string, unknown>;
    periodEnd: z.ZodEffects<z.ZodString, string, unknown>;
    totalContributors: z.ZodNumber;
    totalCommits: z.ZodNumber;
    totalTasksCompleted: z.ZodNumber;
    codeMetrics: z.ZodObject<{
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        netChange: z.ZodNumber;
        characters: z.ZodNumber;
        filesChanged: z.ZodNumber;
        commits: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }, {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    }>;
    contributors: z.ZodArray<z.ZodObject<{
        username: z.ZodString;
        commits: z.ZodNumber;
        tasksCompleted: z.ZodNumber;
        codeMetrics: z.ZodObject<{
            linesAdded: z.ZodNumber;
            linesRemoved: z.ZodNumber;
            netChange: z.ZodNumber;
            characters: z.ZodNumber;
            filesChanged: z.ZodNumber;
            commits: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        }, {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        commits: number;
        tasksCompleted: number;
        codeMetrics: {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        };
        username: string;
    }, {
        commits: number;
        tasksCompleted: number;
        codeMetrics: {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        };
        username: string;
    }>, "many">;
    taskTypeDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    totalCommits: number;
    taskTypeDistribution: Record<string, number>;
    contributors: {
        commits: number;
        tasksCompleted: number;
        codeMetrics: {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        };
        username: string;
    }[];
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    period: "day" | "week" | "month" | "quarter" | "year" | "all";
    periodStart: string;
    periodEnd: string;
    totalContributors: number;
    totalTasksCompleted: number;
}, {
    totalCommits: number;
    taskTypeDistribution: Record<string, number>;
    contributors: {
        commits: number;
        tasksCompleted: number;
        codeMetrics: {
            filesChanged: number;
            linesAdded: number;
            linesRemoved: number;
            netChange: number;
            characters: number;
            commits: number;
        };
        username: string;
    }[];
    codeMetrics: {
        filesChanged: number;
        linesAdded: number;
        linesRemoved: number;
        netChange: number;
        characters: number;
        commits: number;
    };
    period: "day" | "week" | "month" | "quarter" | "year" | "all";
    totalContributors: number;
    totalTasksCompleted: number;
    periodStart?: unknown;
    periodEnd?: unknown;
}>;
/**
 * Statistics query parameters
 * @public
 */
export declare const StatsQuerySchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<["day", "week", "month", "quarter", "year", "all"]>>;
    user: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodBranded<z.ZodString, "TaskId">>;
    detailed: z.ZodOptional<z.ZodBoolean>;
    format: z.ZodOptional<z.ZodEnum<["text", "json", "html"]>>;
}, "strip", z.ZodTypeAny, {
    taskId?: (string & z.BRAND<"TaskId">) | undefined;
    period?: "day" | "week" | "month" | "quarter" | "year" | "all" | undefined;
    user?: string | undefined;
    detailed?: boolean | undefined;
    format?: "text" | "json" | "html" | undefined;
}, {
    taskId?: string | undefined;
    period?: "day" | "week" | "month" | "quarter" | "year" | "all" | undefined;
    user?: string | undefined;
    detailed?: boolean | undefined;
    format?: "text" | "json" | "html" | undefined;
}>;
