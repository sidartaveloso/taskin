import type { IGitAnalyzer } from '@opentask/taskin-git-utils/src/git-analyzer.types';
import type { IMetricsManager } from '@opentask/taskin-task-manager/src/metrics.types';
import {
  type StatsQuery,
  type TaskStats,
  type TaskStatus,
  type TaskType,
  type TeamStats,
  type UserStats,
  UserStatsSchema,
} from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import path from 'path';
import type { UserRegistry } from './user-registry';

/**
 * Task file parsing patterns
 * Extracted as constants for maintainability and testing
 */
const TASK_FILENAME_PATTERN = /^task-(\d+)-/;
const TASK_TITLE_PATTERNS = {
  withDash: /^# .*?[—-]\s*(.+)$/im,
  withNumber: /^# .*?\s+(\d+)\s*-\s*(.+)$/im,
} as const;

/**
 * Internal representation of task file data
 * Used for parsing markdown task files
 */
type TaskFileData = {
  id: string;
  title: string;
  status?: TaskStatus;
  assignee?: string;
  type?: TaskType;
  filePath: string;
};

function iso(d: Date) {
  return d.toISOString();
}

function emptyCodeMetrics() {
  return {
    linesAdded: 0,
    linesRemoved: 0,
    netChange: 0,
    characters: 0,
    filesChanged: 0,
    commits: 0,
  };
}

function emptyTemporalMetrics() {
  return {
    byDayOfWeek: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
    } as Record<string, number>,
    byTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    streak: 0,
    trend: 'stable' as const,
  };
}

/**
 * Calculates code metrics from git commits
 */
async function calculateCodeMetrics(
  gitAnalyzer: IGitAnalyzer | undefined,
  username: string,
  since: Date,
  until: Date,
): Promise<{
  linesAdded: number;
  linesRemoved: number;
  netChange: number;
  characters: number;
  filesChanged: number;
  commits: number;
}> {
  if (!gitAnalyzer) {
    return emptyCodeMetrics();
  }

  try {
    const commits = await gitAnalyzer.getCommits({
      author: username,
      since: since.toISOString(),
      until: until.toISOString(),
    });

    const metrics = commits.reduce(
      (acc, commit) => ({
        linesAdded: acc.linesAdded + commit.linesAdded,
        linesRemoved: acc.linesRemoved + commit.linesRemoved,
        filesChanged: acc.filesChanged + commit.filesChanged,
        commits: acc.commits + 1,
      }),
      {
        linesAdded: 0,
        linesRemoved: 0,
        filesChanged: 0,
        commits: 0,
      },
    );

    return {
      ...metrics,
      netChange: metrics.linesAdded - metrics.linesRemoved,
      characters: (metrics.linesAdded + metrics.linesRemoved) * 40, // estimate ~40 chars/line
    };
  } catch (error) {
    console.warn('Failed to calculate code metrics:', error);
    return emptyCodeMetrics();
  }
}

/**
 * Calculates temporal metrics from git commits
 */
async function calculateTemporalMetrics(
  gitAnalyzer: IGitAnalyzer | undefined,
  username: string,
  since: Date,
  until: Date,
): Promise<{
  byDayOfWeek: Record<string, number>;
  byTimeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  streak: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}> {
  if (!gitAnalyzer) {
    return emptyTemporalMetrics();
  }

  try {
    const commits = await gitAnalyzer.getCommits({
      author: username,
      since: since.toISOString(),
      until: until.toISOString(),
    });

    // Calculate byDayOfWeek
    const byDayOfWeek: Record<string, number> = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
    };
    const byTimeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const commitsByDate = new Map<string, number>();

    for (const commit of commits) {
      const date = new Date(commit.date);
      const day = date.getDay();
      const hour = date.getHours();

      byDayOfWeek[day.toString()]++;

      if (hour >= 6 && hour < 12) byTimeOfDay.morning++;
      else if (hour >= 12 && hour < 18) byTimeOfDay.afternoon++;
      else if (hour >= 18 && hour < 24) byTimeOfDay.evening++;
      else byTimeOfDay.night++;

      const dateKey = date.toISOString().split('T')[0];
      commitsByDate.set(dateKey, (commitsByDate.get(dateKey) || 0) + 1);
    }

    // Calculate streak (consecutive days with commits)
    const sortedDates = Array.from(commitsByDate.keys()).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const daysDiff =
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }

      maxStreak = Math.max(maxStreak, currentStreak);
    }

    // Calculate trend (compare first half vs second half of period)
    const midpoint = Math.floor(commits.length / 2);
    const firstHalf = commits.slice(0, midpoint);
    const secondHalf = commits.slice(midpoint);

    const firstHalfAvg = firstHalf.length
      ? firstHalf.length / Math.max(1, sortedDates.length / 2)
      : 0;
    const secondHalfAvg = secondHalf.length
      ? secondHalf.length / Math.max(1, sortedDates.length / 2)
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.2) trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.8) trend = 'decreasing';

    return {
      byDayOfWeek,
      byTimeOfDay,
      streak: maxStreak,
      trend,
    };
  } catch (error) {
    console.warn('Failed to calculate temporal metrics:', error);
    return emptyTemporalMetrics();
  }
}

/**
 * FileSystem-based metrics adapter with Git integration
 *
 * @remarks
 * This adapter provides real metrics by combining:
 * - Task file parsing for task-related metrics
 * - Git analysis for code metrics and temporal patterns
 *
 * **Features**:
 * - Git commit analysis
 * - Code metrics (lines added/removed, commits, files changed)
 * - Temporal patterns (day of week, time of day)
 * - Streaks and trends
 * - Task completion tracking
 */
export class FileSystemMetricsAdapter implements IMetricsManager {
  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
    private gitAnalyzer?: IGitAnalyzer,
  ) {}

  /**
   * Reads and parses task files from the filesystem
   * @returns Array of parsed task file data
   * @private
   */
  private async readTaskFiles(): Promise<TaskFileData[]> {
    let files: string[];
    try {
      files = await fs.readdir(this.tasksDirectory);
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        console.warn(`Tasks directory not found: ${this.tasksDirectory}`);
        return [];
      }
      // Don't hide unexpected errors
      throw new Error(
        `Failed to read tasks directory: ${error?.message || error}`,
      );
    }

    const taskFiles = files.filter(
      (f) => f.startsWith('task-') && f.endsWith('.md'),
    );
    const tasks: TaskFileData[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(this.tasksDirectory, file);
      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error: any) {
        console.warn(`Failed to read task file ${filePath}: ${error?.message}`);
        continue;
      }

      const idMatch = file.match(TASK_FILENAME_PATTERN);
      const id = idMatch ? idMatch[1] : file;
      const titleMatch =
        content.match(TASK_TITLE_PATTERNS.withDash) ||
        content.match(TASK_TITLE_PATTERNS.withNumber);
      const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, '');

      const extract = (name: string) => {
        const rx = new RegExp(`^${name}:\\s*(.+)$`, 'im');
        const m = content.match(rx);
        return m ? m[1].trim() : undefined;
      };

      const statusValue = extract('Status');
      const assigneeValue = extract('Assignee');
      const typeValue = extract('Type');

      // Validate and cast to proper types
      const validStatuses: TaskStatus[] = [
        'pending',
        'in-progress',
        'done',
        'blocked',
        'canceled',
      ];
      const validTypes: TaskType[] = [
        'feat',
        'fix',
        'refactor',
        'docs',
        'test',
        'chore',
      ];

      const status = validStatuses.includes(statusValue as TaskStatus)
        ? (statusValue as TaskStatus)
        : undefined;
      const type = validTypes.includes(typeValue as TaskType)
        ? (typeValue as TaskType)
        : undefined;

      tasks.push({
        id,
        title,
        status,
        assignee: assigneeValue,
        type,
        filePath,
      });
    }

    return tasks;
  }

  async getUserMetrics(
    userId: string,
    _query?: StatsQuery,
  ): Promise<UserStats> {
    const user = this.userRegistry.getUser(userId);
    const username = user ? user.name : userId;
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tasks = await this.readTaskFiles();
    const assigned = tasks.filter((t) => {
      if (!t.assignee) return false;
      // match by registry id or name
      return (
        t.assignee === user?.id ||
        t.assignee === user?.name ||
        t.assignee === username
      );
    });

    const completed = assigned.filter((t) => t.status === 'done').length;
    const active = assigned.filter((t) => t.status !== 'done').length;

    const codeMetrics = await calculateCodeMetrics(
      this.gitAnalyzer,
      username,
      weekAgo,
      now,
    );

    const temporalMetrics = await calculateTemporalMetrics(
      this.gitAnalyzer,
      username,
      weekAgo,
      now,
    );

    const rawMetrics = {
      username,
      period: 'week',
      periodStart: iso(weekAgo),
      periodEnd: iso(now),
      codeMetrics,
      temporalMetrics,
      contributionMetrics: {
        totalCommits: codeMetrics.commits,
        tasksCompleted: completed,
        averageCompletionTime: 0, // TODO: calculate from task timestamps
        taskTypeDistribution: {}, // TODO: calculate from task types
        activityFrequency: codeMetrics.commits / 7, // commits per day
      },
      engagementMetrics: {
        commitsPerDay: codeMetrics.commits / 7,
        consistency: 0, // TODO: calculate standard deviation
        activeTasksCount: active,
        completionRate: assigned.length ? completed / assigned.length : 0,
      },
      topTasks: [],
    };

    // Validate output with Zod schema for runtime type safety
    return UserStatsSchema.parse(rawMetrics);
  }

  async getTeamMetrics(
    _teamId: string,
    _query?: StatsQuery,
  ): Promise<TeamStats> {
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tasks = await this.readTaskFiles();

    const contributors = new Map<
      string,
      {
        username: string;
        commits: number;
        tasksCompleted: number;
        codeMetrics: any;
      }
    >();

    for (const t of tasks) {
      const assignee = t.assignee || 'unknown';
      const prev = contributors.get(assignee) || {
        username: assignee,
        commits: 0,
        tasksCompleted: 0,
        codeMetrics: emptyCodeMetrics(),
      };
      prev.commits += 0;
      if (t.status === 'done') prev.tasksCompleted += 1;
      contributors.set(assignee, prev);
    }

    const team: TeamStats = {
      period: 'week',
      periodStart: iso(weekAgo),
      periodEnd: iso(now),
      totalContributors: contributors.size,
      totalCommits: 0,
      totalTasksCompleted: Array.from(contributors.values()).reduce(
        (s, c) => s + c.tasksCompleted,
        0,
      ),
      codeMetrics: emptyCodeMetrics(),
      contributors: Array.from(contributors.values()).map((c) => ({
        username: c.username,
        commits: c.commits,
        tasksCompleted: c.tasksCompleted,
        codeMetrics: c.codeMetrics,
      })),
      taskTypeDistribution: {},
    } as unknown as TeamStats;

    return team;
  }

  async getTaskMetrics(
    taskId: string,
    _query?: StatsQuery,
  ): Promise<TaskStats> {
    const tasks = await this.readTaskFiles();
    const found = tasks.find(
      (t) => t.id === taskId || t.filePath.includes(taskId),
    );
    const now = new Date();
    const base = {
      taskId,
      title: found ? found.title : taskId,
      type: (found && found.type) || 'feat',
      status: (found && (found.status as any)) || 'pending',
      assignee: found?.assignee,
      duration: 0,
      created: iso(now),
      contributors: [],
      codeMetrics: emptyCodeMetrics(),
      refactoringMetrics: undefined,
      temporalMetrics: emptyTemporalMetrics(),
      workPattern: { mostActiveTimeOfDay: 'morning', daysWorked: 0, gaps: 0 },
      commitHistory: {
        totalCommits: 0,
        averageCommitSize: 0,
        largestCommit: { linesAdded: 0, linesRemoved: 0 },
        smallestCommit: { linesAdded: 0, linesRemoved: 0 },
      },
      firstCommit: undefined,
      lastCommit: undefined,
      statusChangedToDone: undefined,
      createdAt: undefined,
    } as unknown as TaskStats;

    return base;
  }
}
