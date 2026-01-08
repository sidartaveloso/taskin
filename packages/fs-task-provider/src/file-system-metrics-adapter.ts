import type { IMetricsManager } from '@opentask/taskin-task-manager';
import type {
  StatsQuery,
  TaskStats,
  TeamStats,
  UserStats,
} from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import path from 'path';
import type { UserRegistry } from './user-registry';

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

export class FileSystemMetricsAdapter implements IMetricsManager {
  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
  ) {}

  private async readTaskFiles() {
    const files = await fs
      .readdir(this.tasksDirectory)
      .catch(() => [] as string[]);
    const taskFiles = files.filter(
      (f) => f.startsWith('task-') && f.endsWith('.md'),
    );
    const tasks: Array<{
      id: string;
      title: string;
      status?: string;
      assignee?: string;
      type?: string;
      filePath: string;
    }> = [];

    for (const file of taskFiles) {
      const filePath = path.join(this.tasksDirectory, file);
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      const idMatch = file.match(/^task-(\d+)-/);
      const id = idMatch ? idMatch[1] : file;
      const titleMatch =
        content.match(/^# .*?[—-]\s*(.+)$/im) ||
        content.match(/^# .*?\s+(\d+)\s*-\s*(.+)$/im);
      const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, '');

      const extract = (name: string) => {
        const rx = new RegExp(`^${name}:\\s*(.+)$`, 'im');
        const m = content.match(rx);
        return m ? m[1].trim() : undefined;
      };

      const status = extract('Status');
      const assignee = extract('Assignee');
      const type = extract('Type');

      tasks.push({ id, title, status, assignee, type, filePath });
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

    const userStats: UserStats = {
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
    } as unknown as UserStats;

    return userStats;
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
