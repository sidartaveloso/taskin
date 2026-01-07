import { describe, expect, it } from 'vitest';
import {
  CodeMetricsSchema,
  CommitSizeSchema,
  ContributionMetricsSchema,
  DayOfWeekSchema,
  EngagementMetricsSchema,
  GitCommitSchema,
  RefactoringMetricsSchema,
  StatsPeriodSchema,
  StatsQuerySchema,
  TASK_STATUSES,
  TASK_TYPES,
  TaskIdSchema,
  TaskSchema,
  TaskStatsSchema,
  TaskStatusSchema,
  TaskTypeSchema,
  TeamStatsSchema,
  TemporalMetricsSchema,
  TimeOfDaySchema,
  UserSchema,
  UserStatsSchema,
} from './taskin.schemas.js';

describe('Taskin Schemas', () => {
  describe('TaskIdSchema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(TaskIdSchema.parse(validUUID)).toBe(validUUID);
    });

    it('should reject invalid UUID', () => {
      expect(() => TaskIdSchema.parse('not-a-uuid')).toThrow();
      expect(() => TaskIdSchema.parse('123')).toThrow();
    });
  });

  describe('TaskStatusSchema', () => {
    it('should accept all valid statuses', () => {
      TASK_STATUSES.forEach(status => {
        expect(TaskStatusSchema.parse(status)).toBe(status);
      });
    });

    it('should reject invalid status', () => {
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('TaskTypeSchema', () => {
    it('should accept all valid types', () => {
      TASK_TYPES.forEach(type => {
        expect(TaskTypeSchema.parse(type)).toBe(type);
      });
    });

    it('should reject invalid type', () => {
      expect(() => TaskTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('UserSchema', () => {
    it('should accept valid user', () => {
      const user = {
        id: 'user-123',
        name: 'Sidarta Veloso',
        email: 'sidarta@example.com',
      };
      expect(UserSchema.parse(user)).toEqual(user);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        id: 'user-123',
        name: 'Sidarta',
        email: 'not-an-email',
      };
      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });
  });

  describe('TaskSchema', () => {
    it('should accept valid task', () => {
      const task = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Implement feature',
        type: 'feat' as const,
        status: 'in-progress' as const,
        createdAt: '2026-01-07T10:00:00Z',
        description: 'Description here',
      };
      expect(TaskSchema.parse(task)).toEqual(task);
    });

    it('should accept task with optional fields', () => {
      const minimalTask = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Task',
        type: 'feat' as const,
        status: 'pending' as const,
        createdAt: '2026-01-07T10:00:00Z',
      };
      expect(TaskSchema.parse(minimalTask)).toEqual(minimalTask);
    });
  });
});

describe('Stats & Track Record Schemas', () => {
  describe('StatsPeriodSchema', () => {
    it('should accept valid period values', () => {
      expect(StatsPeriodSchema.parse('day')).toBe('day');
      expect(StatsPeriodSchema.parse('week')).toBe('week');
      expect(StatsPeriodSchema.parse('month')).toBe('month');
      expect(StatsPeriodSchema.parse('quarter')).toBe('quarter');
      expect(StatsPeriodSchema.parse('year')).toBe('year');
      expect(StatsPeriodSchema.parse('all')).toBe('all');
    });

    it('should reject invalid period values', () => {
      expect(() => StatsPeriodSchema.parse('invalid')).toThrow();
      expect(() => StatsPeriodSchema.parse('daily')).toThrow();
    });
  });

  describe('TimeOfDaySchema', () => {
    it('should accept valid time of day values', () => {
      expect(TimeOfDaySchema.parse('morning')).toBe('morning');
      expect(TimeOfDaySchema.parse('afternoon')).toBe('afternoon');
      expect(TimeOfDaySchema.parse('evening')).toBe('evening');
      expect(TimeOfDaySchema.parse('night')).toBe('night');
    });

    it('should reject invalid time of day values', () => {
      expect(() => TimeOfDaySchema.parse('dawn')).toThrow();
      expect(() => TimeOfDaySchema.parse('noon')).toThrow();
    });
  });

  describe('DayOfWeekSchema', () => {
    it('should accept valid day of week numbers (0-6)', () => {
      expect(DayOfWeekSchema.parse(0)).toBe(0); // Sunday
      expect(DayOfWeekSchema.parse(3)).toBe(3); // Wednesday
      expect(DayOfWeekSchema.parse(6)).toBe(6); // Saturday
    });

    it('should reject invalid day of week numbers', () => {
      expect(() => DayOfWeekSchema.parse(-1)).toThrow();
      expect(() => DayOfWeekSchema.parse(7)).toThrow();
      expect(() => DayOfWeekSchema.parse(10)).toThrow();
    });
  });

  describe('CommitSizeSchema', () => {
    it('should accept valid commit size classifications', () => {
      expect(CommitSizeSchema.parse('small')).toBe('small');
      expect(CommitSizeSchema.parse('medium')).toBe('medium');
      expect(CommitSizeSchema.parse('large')).toBe('large');
    });

    it('should reject invalid commit sizes', () => {
      expect(() => CommitSizeSchema.parse('tiny')).toThrow();
      expect(() => CommitSizeSchema.parse('huge')).toThrow();
    });
  });

  describe('GitCommitSchema', () => {
    it('should accept valid git commit data', () => {
      const commit = {
        hash: 'abc123def456',
        author: 'sidarta',
        date: '2026-01-07T10:30:00Z',
        message: 'feat: add stats feature',
        filesChanged: 5,
        linesAdded: 120,
        linesRemoved: 30,
      };

      expect(GitCommitSchema.parse(commit)).toEqual(commit);
    });

    it('should accept commits with co-authors', () => {
      const commit = {
        hash: 'abc123',
        author: 'sidarta',
        date: '2026-01-07T10:30:00Z',
        message: 'feat: add feature',
        filesChanged: 3,
        linesAdded: 50,
        linesRemoved: 10,
        coAuthors: ['maria', 'joão'],
      };

      expect(GitCommitSchema.parse(commit)).toEqual(commit);
    });

    it('should reject commits with negative values', () => {
      const invalidCommit = {
        hash: 'abc123',
        author: 'sidarta',
        date: '2026-01-07T10:30:00Z',
        message: 'fix: bug fix',
        filesChanged: -1,
        linesAdded: 10,
        linesRemoved: 5,
      };

      expect(() => GitCommitSchema.parse(invalidCommit)).toThrow();
    });

    it('should reject commits with invalid datetime', () => {
      const invalidCommit = {
        hash: 'abc123',
        author: 'sidarta',
        date: 'invalid-date',
        message: 'fix: bug fix',
        filesChanged: 1,
        linesAdded: 10,
        linesRemoved: 5,
      };

      expect(() => GitCommitSchema.parse(invalidCommit)).toThrow();
    });
  });

  describe('CodeMetricsSchema', () => {
    it('should accept valid code metrics', () => {
      const metrics = {
        linesAdded: 1245,
        linesRemoved: 832,
        netChange: 413,
        characters: 89430,
        filesChanged: 37,
        commits: 23,
      };

      expect(CodeMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should accept negative net change for refactoring', () => {
      const metrics = {
        linesAdded: 200,
        linesRemoved: 500,
        netChange: -300,
        characters: 15000,
        filesChanged: 8,
        commits: 5,
      };

      expect(CodeMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should reject negative values for lines added/removed', () => {
      const invalidMetrics = {
        linesAdded: -100,
        linesRemoved: 50,
        netChange: -150,
        characters: 5000,
        filesChanged: 3,
        commits: 2,
      };

      expect(() => CodeMetricsSchema.parse(invalidMetrics)).toThrow();
    });
  });

  describe('RefactoringMetricsSchema', () => {
    it('should calculate excellent refactoring (ratio > 1.5)', () => {
      const metrics = {
        simplificationRatio: 1.97,
        linesRemoved: 450,
        linesAdded: 228,
        netReduction: -222,
        reductionPercentage: 25,
        quality: 'excellent' as const,
      };

      expect(RefactoringMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should calculate good refactoring (ratio > 1.0)', () => {
      const metrics = {
        simplificationRatio: 1.2,
        linesRemoved: 120,
        linesAdded: 100,
        netReduction: -20,
        reductionPercentage: 10,
        quality: 'good' as const,
      };

      expect(RefactoringMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should handle neutral refactoring (similar volume)', () => {
      const metrics = {
        simplificationRatio: 1.0,
        linesRemoved: 100,
        linesAdded: 100,
        netReduction: 0,
        reductionPercentage: 0,
        quality: 'neutral' as const,
      };

      expect(RefactoringMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should handle expansion refactoring (code grew)', () => {
      const metrics = {
        simplificationRatio: 0.5,
        linesRemoved: 50,
        linesAdded: 100,
        netReduction: 50,
        reductionPercentage: -50,
        quality: 'expansion' as const,
      };

      expect(RefactoringMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should reject zero or negative simplification ratio', () => {
      const invalidMetrics = {
        simplificationRatio: 0,
        linesRemoved: 0,
        linesAdded: 100,
        netReduction: 100,
        reductionPercentage: -100,
        quality: 'expansion' as const,
      };

      expect(() => RefactoringMetricsSchema.parse(invalidMetrics)).toThrow();
    });
  });

  describe('TemporalMetricsSchema', () => {
    it('should accept valid temporal metrics with weekly distribution', () => {
      const metrics = {
        byDayOfWeek: {
          '0': 2,  // Sunday
          '1': 5,  // Monday
          '2': 3,  // Tuesday
          '3': 8,  // Wednesday
          '4': 4,  // Thursday
          '5': 2,  // Friday
          '6': 1,  // Saturday
        },
        byTimeOfDay: {
          morning: 15,
          afternoon: 5,
          evening: 3,
          night: 0,
        },
        streak: 7,
        trend: 'increasing' as const,
      };

      expect(TemporalMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should accept all trend types', () => {
      const increasing = TemporalMetricsSchema.parse({
        byDayOfWeek: {},
        byTimeOfDay: {},
        streak: 5,
        trend: 'increasing',
      });
      expect(increasing.trend).toBe('increasing');

      const stable = TemporalMetricsSchema.parse({
        byDayOfWeek: {},
        byTimeOfDay: {},
        streak: 5,
        trend: 'stable',
      });
      expect(stable.trend).toBe('stable');

      const decreasing = TemporalMetricsSchema.parse({
        byDayOfWeek: {},
        byTimeOfDay: {},
        streak: 5,
        trend: 'decreasing',
      });
      expect(decreasing.trend).toBe('decreasing');
    });
  });

  describe('ContributionMetricsSchema', () => {
    it('should accept valid contribution metrics with task distribution', () => {
      const metrics = {
        totalCommits: 23,
        tasksCompleted: 4,
        averageCompletionTime: 3.5,
        taskTypeDistribution: {
          feat: 2,
          fix: 1,
          docs: 1,
          refactor: 0,
          test: 0,
          chore: 0,
        },
        activityFrequency: 3.3,
      };

      expect(ContributionMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should reject negative commit values', () => {
      const invalidMetrics = {
        totalCommits: -5,
        tasksCompleted: 4,
        averageCompletionTime: 3.5,
        taskTypeDistribution: { feat: 2 },
        activityFrequency: 3.3,
      };

      expect(() => ContributionMetricsSchema.parse(invalidMetrics)).toThrow();
    });
  });

  describe('EngagementMetricsSchema', () => {
    it('should accept valid engagement metrics', () => {
      const metrics = {
        commitsPerDay: 3.3,
        consistency: 0.85,
        activeTasksCount: 2,
        completionRate: 0.8,
      };

      expect(EngagementMetricsSchema.parse(metrics)).toEqual(metrics);
    });

    it('should reject consistency values outside 0-1 range', () => {
      const invalidMetrics = {
        commitsPerDay: 3.3,
        consistency: 1.5,
        activeTasksCount: 2,
        completionRate: 0.8,
      };

      expect(() => EngagementMetricsSchema.parse(invalidMetrics)).toThrow();
    });

    it('should reject completion rate outside 0-1 range', () => {
      const invalidMetrics = {
        commitsPerDay: 3.3,
        consistency: 0.85,
        activeTasksCount: 2,
        completionRate: 1.2,
      };

      expect(() => EngagementMetricsSchema.parse(invalidMetrics)).toThrow();
    });
  });

  describe('TaskStatsSchema', () => {
    const validTaskStats = {
      taskId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Refactor authentication',
      type: 'refactor' as const,
      status: 'done' as const,
      assignee: 'sidarta',
      duration: 3,
      created: '2026-01-03T09:15:00Z',
      firstCommit: '2026-01-03T10:30:00Z',
      lastCommit: '2026-01-06T14:22:00Z',
      statusChangedToDone: '2026-01-06T15:00:00Z',
      contributors: [
        { name: 'sidarta', commits: 8 },
        { name: 'maria', commits: 2, isCoAuthor: true },
      ],
      codeMetrics: {
        linesAdded: 228,
        linesRemoved: 450,
        netChange: -222,
        characters: 12800,
        filesChanged: 8,
        commits: 10,
      },
      refactoringMetrics: {
        simplificationRatio: 1.97,
        linesRemoved: 450,
        linesAdded: 228,
        netReduction: -222,
        reductionPercentage: 25,
        quality: 'excellent' as const,
      },
      temporalMetrics: {
        byDayOfWeek: { '3': 4, '4': 3, '5': 2, '6': 1 },
        byTimeOfDay: { morning: 6, afternoon: 3, evening: 1, night: 0 },
        streak: 4,
        trend: 'stable' as const,
      },
      workPattern: {
        mostActiveTimeOfDay: 'morning' as const,
        daysWorked: 4,
        gaps: 0,
      },
      commitHistory: {
        totalCommits: 10,
        averageCommitSize: 85,
        largestCommit: { linesAdded: 150, linesRemoved: 280 },
        smallestCommit: { linesAdded: 5, linesRemoved: 8 },
      },
    };

    it('should accept valid task stats with all fields', () => {
      expect(TaskStatsSchema.parse(validTaskStats)).toEqual(validTaskStats);
    });

    it('should accept task stats without refactoring metrics for non-refactor tasks', () => {
      const { refactoringMetrics: _unused, ...statsWithoutRefactoring } = validTaskStats;
      expect(TaskStatsSchema.parse(statsWithoutRefactoring)).toEqual(statsWithoutRefactoring);
    });

    it('should accept task stats without optional timestamp fields', () => {
      const minimalStats = {
        ...validTaskStats,
        firstCommit: undefined,
        lastCommit: undefined,
        statusChangedToDone: undefined,
        assignee: undefined,
      };

      const parsed = TaskStatsSchema.parse(minimalStats);
      expect(parsed.firstCommit).toBeUndefined();
      expect(parsed.lastCommit).toBeUndefined();
      expect(parsed.statusChangedToDone).toBeUndefined();
      expect(parsed.assignee).toBeUndefined();
    });
  });

  describe('UserStatsSchema', () => {
    const validUserStats = {
      username: 'sidarta',
      period: 'week' as const,
      periodStart: '2026-01-01T00:00:00Z',
      periodEnd: '2026-01-07T23:59:59Z',
      codeMetrics: {
        linesAdded: 1245,
        linesRemoved: 832,
        netChange: 413,
        characters: 89430,
        filesChanged: 37,
        commits: 23,
      },
      temporalMetrics: {
        byDayOfWeek: { '1': 5, '2': 3, '3': 8, '4': 4, '5': 2 },
        byTimeOfDay: { morning: 15, afternoon: 5, evening: 3, night: 0 },
        streak: 7,
        trend: 'increasing' as const,
      },
      contributionMetrics: {
        totalCommits: 23,
        tasksCompleted: 4,
        averageCompletionTime: 3.5,
        taskTypeDistribution: { feat: 2, fix: 1, docs: 1, refactor: 0, test: 0, chore: 0 },
        activityFrequency: 3.3,
      },
      engagementMetrics: {
        commitsPerDay: 3.3,
        consistency: 0.85,
        activeTasksCount: 2,
        completionRate: 0.8,
      },
      topTasks: [
        { taskId: '550e8400-e29b-41d4-a716-446655440000', title: 'Task 1', commits: 10 },
        { taskId: '550e8400-e29b-41d4-a716-446655440001', title: 'Task 2', commits: 8 },
      ],
    };

    it('should accept valid user stats for a weekly period', () => {
      expect(UserStatsSchema.parse(validUserStats)).toEqual(validUserStats);
    });

    it('should accept user stats with refactoring metrics', () => {
      const statsWithRefactoring = {
        ...validUserStats,
        refactoringMetrics: {
          simplificationRatio: 1.5,
          linesRemoved: 300,
          linesAdded: 200,
          netReduction: -100,
          reductionPercentage: 15,
          quality: 'good' as const,
        },
      };

      expect(UserStatsSchema.parse(statsWithRefactoring)).toEqual(statsWithRefactoring);
    });

    it('should reject more than 10 top tasks', () => {
      const tooManyTasks = {
        ...validUserStats,
        topTasks: Array.from({ length: 11 }, (_, i) => ({
          taskId: `550e8400-e29b-41d4-a716-44665544000${i}`,
          title: `Task ${i}`,
          commits: 5,
        })),
      };

      expect(() => UserStatsSchema.parse(tooManyTasks)).toThrow();
    });
  });

  describe('TeamStatsSchema', () => {
    const validTeamStats = {
      period: 'month' as const,
      periodStart: '2026-01-01T00:00:00Z',
      periodEnd: '2026-01-31T23:59:59Z',
      totalContributors: 3,
      totalCommits: 50,
      totalTasksCompleted: 12,
      codeMetrics: {
        linesAdded: 2500,
        linesRemoved: 1200,
        netChange: 1300,
        characters: 180000,
        filesChanged: 85,
        commits: 50,
      },
      contributors: [
        {
          username: 'sidarta',
          commits: 25,
          tasksCompleted: 6,
          codeMetrics: {
            linesAdded: 1200,
            linesRemoved: 600,
            netChange: 600,
            characters: 90000,
            filesChanged: 40,
            commits: 25,
          },
        },
        {
          username: 'maria',
          commits: 15,
          tasksCompleted: 4,
          codeMetrics: {
            linesAdded: 800,
            linesRemoved: 400,
            netChange: 400,
            characters: 60000,
            filesChanged: 30,
            commits: 15,
          },
        },
      ],
      taskTypeDistribution: {
        feat: 5,
        fix: 3,
        docs: 2,
        refactor: 1,
        test: 1,
        chore: 0,
      },
    };

    it('should accept valid team stats for a monthly period', () => {
      expect(TeamStatsSchema.parse(validTeamStats)).toEqual(validTeamStats);
    });

    it('should accept empty contributors array for new projects', () => {
      const emptyTeam = {
        ...validTeamStats,
        totalContributors: 0,
        contributors: [],
      };

      expect(TeamStatsSchema.parse(emptyTeam)).toEqual(emptyTeam);
    });
  });

  describe('StatsQuerySchema', () => {
    it('should accept query with all parameters', () => {
      const query = {
        period: 'week' as const,
        user: 'sidarta',
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        detailed: true,
        format: 'json' as const,
      };

      expect(StatsQuerySchema.parse(query)).toEqual(query);
    });

    it('should accept query with no parameters for default stats', () => {
      expect(StatsQuerySchema.parse({})).toEqual({});
    });

    it('should accept query with only period filter', () => {
      const query = { period: 'month' as const };
      expect(StatsQuerySchema.parse(query)).toEqual(query);
    });

    it('should accept all format options', () => {
      expect(StatsQuerySchema.parse({ format: 'text' }).format).toBe('text');
      expect(StatsQuerySchema.parse({ format: 'json' }).format).toBe('json');
      expect(StatsQuerySchema.parse({ format: 'html' }).format).toBe('html');
    });

    it('should reject invalid format', () => {
      expect(() => StatsQuerySchema.parse({ format: 'xml' })).toThrow();
    });

    it('should accept taskId filter for task-specific stats', () => {
      const query = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        detailed: true,
      };
      expect(StatsQuerySchema.parse(query)).toEqual(query);
    });
  });
});
