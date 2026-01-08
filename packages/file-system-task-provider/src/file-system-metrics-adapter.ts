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

function zeroCodeMetrics() {
  return {
    linesAdded: 0,
    linesRemoved: 0,
    netChange: 0,
    characters: 0,
    filesChanged: 0,
    commits: 0,
  };
}

function zeroTemporal() {
  return {
    byDayOfWeek: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    byTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    streak: 0,
    trend: 'stable' as const,
  };
}

function zeroContribution() {
  return {
    totalCommits: 0,
    tasksCompleted: 0,
    averageCompletionTime: 0,
    taskTypeDistribution: {},
    activityFrequency: 0,
  };
}

function zeroEngagement() {
  return {
    commitsPerDay: 0,
    consistency: 0,
    activeTasksCount: 0,
    completionRate: 0,
  };
}

/**
 * FileSystem-based metrics adapter (Work In Progress)
 *
 * @remarks
 * **⚠️ CURRENT LIMITATION**: This adapter currently returns mock/zero values for most metrics.
 * Full implementation with Git integration is planned for task-011.2 and task-011.3.
 *
 * **What works now**:
 * - Task counting (assigned, completed, active)
 * - Basic completion rate calculation
 *
 * **Not yet implemented** (returns zeros):
 * - Git commit analysis
 * - Code metrics (lines added/removed)
 * - Temporal patterns (day of week, time of day)
 * - Streaks and trends
 *
 * @see https://github.com/opentask/taskin/issues/task-011
 * @notImplemented Full metrics calculation requires IGitAnalyzer integration
 */
export class FileSystemMetricsAdapter implements IMetricsManager {
  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
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

      tasks.push({ id, title, status, assignee: assigneeValue, type, filePath });
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

    const rawMetrics = {
      username,
      period: 'week',
      periodStart: iso(weekAgo),
      periodEnd: iso(now),
      codeMetrics: zeroCodeMetrics(),
      temporalMetrics: zeroTemporal(),
      contributionMetrics: { ...zeroContribution(), tasksCompleted: completed },
      engagementMetrics: {
        ...zeroEngagement(),
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
        codeMetrics: zeroCodeMetrics(),
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
      codeMetrics: zeroCodeMetrics(),
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
      codeMetrics: zeroCodeMetrics(),
      refactoringMetrics: undefined,
      temporalMetrics: zeroTemporal(),
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
