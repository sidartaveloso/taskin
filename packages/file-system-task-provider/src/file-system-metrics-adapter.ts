import type { IGitAnalyzer } from '@opentask/taskin-git-utils';
import type { IMetricsManager, IUserRegistry } from '@opentask/taskin-task-manager';
import {
  type GitCommit,
  type StatsQuery,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskStats,
  type TaskStatus,
  type TaskType,
  type TeamStats,
  type UserStats,
  UserStatsSchema,
} from '@opentask/taskin-types';
import { classifyAssignee, foldAssignee } from './assignee-identity.js';
import { stripHardBreak } from './inline-metadata.js';

/**
 * As sete chaves de `byDayOfWeek`, na forma que `Date.getDay()` produz.
 *
 * Fechar o registro nelas em vez de `Record<string, number>` e o que permite
 * `byDayOfWeek[k]++`: com indice `string` o lookup e `number | undefined` e o
 * incremento nao compila. O registro largo escondia que a chave e conhecida.
 */
type DayOfWeekKey = '0' | '1' | '2' | '3' | '4' | '5' | '6';

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Time constants for date calculations
 */
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

const MILLISECONDS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

/**
 * Task file parsing patterns
 * Extracted as constants for maintainability and testing
 */
const TASK_FILENAME_PATTERN = /^task-(\d+)(?:-.+)?\.md$/;
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

/**
 * Converts a Date object to ISO 8601 string format
 * @param date - The date to convert
 * @returns ISO 8601 formatted string (e.g., "2026-01-16T10:30:00.000Z")
 */
function toISOString(date: Date): string {
  return date.toISOString();
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
 * Removes code blocks (fenced with ```) from markdown content
 * This prevents parsing metadata that appears inside code examples
 */
function removeCodeBlocks(content: string): string {
  // Remove triple-backtick code blocks (including language identifier)
  return content.replace(/```[\s\S]*?```/g, '');
}

/**
 * Resolves a time period to date range
 * @param period - The time period (day, week, month, year)
 * @returns Object with since and until dates
 */
function resolvePeriod(period: 'day' | 'week' | 'month' | 'year' | 'quarter' | 'all' = 'week'): {
  since: Date;
  until: Date;
} {
  const now = new Date();
  const until = now;
  let since: Date;

  switch (period) {
    case 'day':
      since = new Date(Date.now() - MILLISECONDS_PER_DAY);
      break;
    case 'week':
      since = new Date(Date.now() - DAYS_PER_WEEK * MILLISECONDS_PER_DAY);
      break;
    case 'month':
      since = new Date(Date.now() - 30 * MILLISECONDS_PER_DAY);
      break;
    case 'quarter':
      since = new Date(Date.now() - 90 * MILLISECONDS_PER_DAY);
      break;
    case 'year':
      since = new Date(Date.now() - 365 * MILLISECONDS_PER_DAY);
      break;
    case 'all':
      since = new Date(0); // Unix epoch
      break;
    default:
      since = new Date(Date.now() - DAYS_PER_WEEK * MILLISECONDS_PER_DAY);
  }

  return { since, until };
}

/**
 * Calculates activity frequency (commits per day) for a given period
 */
function calculateActivityFrequency(
  commits: number,
  period: 'day' | 'week' | 'month' | 'year' | 'quarter' | 'all',
): number {
  const daysInPeriod: Record<typeof period, number> = {
    day: 1,
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
    all: 365, // Use 1 year as baseline for 'all'
  };

  return commits / daysInPeriod[period];
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
      (
        acc: {
          linesAdded: number;
          linesRemoved: number;
          filesChanged: number;
          commits: number;
        },
        commit: GitCommit,
      ) => ({
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
  byDayOfWeek: Record<DayOfWeekKey, number>;
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
    const byDayOfWeek: Record<DayOfWeekKey, number> = {
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

      byDayOfWeek[day.toString() as DayOfWeekKey]++;

      if (hour >= 6 && hour < 12) byTimeOfDay.morning++;
      else if (hour >= 12 && hour < 18) byTimeOfDay.afternoon++;
      else if (hour >= 18 && hour < 24) byTimeOfDay.evening++;
      else byTimeOfDay.night++;

      const dateKey = date.toISOString().slice(0, 10);
      commitsByDate.set(dateKey, (commitsByDate.get(dateKey) || 0) + 1);
    }

    // Calculate streak (consecutive days with commits)
    const sortedDates = Array.from(commitsByDate.keys()).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    for (const [i, current] of sortedDates.entries()) {
      const previous = sortedDates[i - 1];
      if (previous === undefined) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(previous);
        const currDate = new Date(current);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

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

    const firstHalfAvg = firstHalf.length ? firstHalf.length / Math.max(1, sortedDates.length / 2) : 0;
    const secondHalfAvg = secondHalf.length ? secondHalf.length / Math.max(1, sortedDates.length / 2) : 0;

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
/**
 * How one contributor is addressed while team metrics are assembled: `key` is
 * the identity (registry id, or a folded spelling for someone unregistered) and
 * `username` is what the report shows.
 */
interface ContributorIdentity {
  key: string;
  username: string;
}

/** Running totals for one contributor. */
interface ContributorTally {
  username: string;
  commits: number;
  tasksCompleted: number;
  codeMetrics: ReturnType<typeof emptyCodeMetrics>;
}

export class FileSystemMetricsAdapter implements IMetricsManager {
  constructor(
    private tasksDirectory: string,
    private userRegistry: IUserRegistry,
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        console.warn(`Tasks directory not found: ${this.tasksDirectory}`);
        return [];
      }
      // Don't hide unexpected errors
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read tasks directory: ${message}`);
    }

    const taskFiles = files.filter((f) => f.startsWith('task-') && f.endsWith('.md'));
    const tasks: TaskFileData[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(this.tasksDirectory, file);
      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to read task file ${filePath}: ${message}`);
        continue;
      }

      const id = file.match(TASK_FILENAME_PATTERN)?.[1] ?? file;
      const titleMatch = content.match(TASK_TITLE_PATTERNS.withDash) ?? content.match(TASK_TITLE_PATTERNS.withNumber);
      const title = titleMatch?.[1] ?? file.replace(/\.md$/, '');

      // Remove code blocks before extracting metadata to avoid parsing examples
      const contentWithoutCodeBlocks = removeCodeBlocks(content);

      const extract = (name: string) => {
        const rx = new RegExp(`^${name}:\\s*(.+)$`, 'im');
        const captured = contentWithoutCodeBlocks.match(rx)?.[1];
        return captured === undefined ? undefined : stripHardBreak(captured);
      };

      const statusValue = extract('Status');
      const assigneeValue = extract('Assignee');
      const typeValue = extract('Type');

      // Validate and cast to proper types
      const validStatuses: readonly TaskStatus[] = TASK_STATUSES;
      const validTypes: readonly TaskType[] = TASK_TYPES;

      const status = validStatuses.includes(statusValue as TaskStatus) ? (statusValue as TaskStatus) : undefined;
      const type = validTypes.includes(typeValue as TaskType) ? (typeValue as TaskType) : undefined;

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

  async getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats> {
    const user = this.userRegistry.getUser(userId);
    const username = user ? user.name : userId;
    const { since, until } = resolvePeriod(query?.period || 'week');
    const now = until;
    const weekAgo = since;

    const tasks = await this.readTaskFiles();
    const assigned = tasks.filter((t) => {
      if (!t.assignee) return false;
      // match by registry id or name
      return t.assignee === user?.id || t.assignee === user?.name || t.assignee === username;
    });

    const completed = assigned.filter((t) => t.status === 'done').length;
    const active = assigned.filter((t) => t.status !== 'done').length;

    const codeMetrics = await calculateCodeMetrics(this.gitAnalyzer, username, weekAgo, now);

    const temporalMetrics = await calculateTemporalMetrics(this.gitAnalyzer, username, weekAgo, now);

    const rawMetrics = {
      username,
      period: query?.period || 'week',
      periodStart: toISOString(weekAgo),
      periodEnd: toISOString(now),
      codeMetrics,
      temporalMetrics,
      contributionMetrics: {
        totalCommits: codeMetrics.commits,
        tasksCompleted: completed,
        averageCompletionTime: 0, // TODO: calculate from task timestamps
        taskTypeDistribution: {}, // TODO: calculate from task types
        activityFrequency: calculateActivityFrequency(codeMetrics.commits, query?.period || 'week'),
      },
      engagementMetrics: {
        commitsPerDay: calculateActivityFrequency(codeMetrics.commits, query?.period || 'week'),
        consistency: 0, // TODO: calculate standard deviation
        activeTasksCount: active,
        completionRate: assigned.length ? completed / assigned.length : 0,
      },
      topTasks: [],
    };

    // Validate output with Zod schema for runtime type safety
    return UserStatsSchema.parse(rawMetrics);
  }

  async getTeamMetrics(_teamId: string, query?: StatsQuery): Promise<TeamStats> {
    const { since, until } = resolvePeriod(query?.period || 'week');
    const now = until;
    const weekAgo = since;
    const tasks = await this.readTaskFiles();

    const contributors = new Map<string, ContributorTally>();

    /*
     * Uma pessoa e uma chave. Antes o agrupamento era `assignee.toLowerCase()`
     * da string crua do arquivo, entao `Sidarta Veloso`, `sidarta-veloso` e
     * `sidartaveloso` viravam tres contribuidores — e `A definir` virava um
     * quarto. Passa pelo registro para que a identidade decida, nao a grafia.
     */
    const identify = (raw: string): ContributorIdentity | undefined => {
      const identity = classifyAssignee(raw, this.userRegistry);

      switch (identity.kind) {
        case 'resolved':
        case 'correctable':
          return { key: identity.user.id, username: identity.user.name };
        case 'unassigned':
          // Nao e pessoa: e "ninguem ainda".
          return undefined;
        case 'unknown':
          // O trabalho aconteceu mesmo sem cadastro; conta, com a grafia dele.
          return { key: `unregistered:${foldAssignee(identity.raw)}`, username: identity.raw.trim() };
        default:
          identity satisfies never;
          return undefined;
      }
    };

    const upsert = ({
      key,
      username,
    }: {
      key: string;
      username: string;
    }): typeof contributors extends Map<string, infer TValue> ? TValue : never => {
      const existing = contributors.get(key);
      if (existing) return existing;

      const created = { username, commits: 0, tasksCompleted: 0, codeMetrics: emptyCodeMetrics() };
      contributors.set(key, created);
      return created;
    };

    /*
     * Trabalho concluido sem dono continua sendo trabalho concluido. Contado
     * aqui, fora do mapa de contribuidores, para nao inventar pessoa nem
     * apagar a entrega.
     */
    let unattributedTasksCompleted = 0;

    // Collect task completion data
    for (const t of tasks) {
      const identified = t.assignee === undefined ? undefined : identify(t.assignee);

      if (!identified) {
        if (t.status === 'done') unattributedTasksCompleted += 1;
        continue;
      }

      const entry = upsert(identified);
      if (t.status === 'done') entry.tasksCompleted += 1;
    }

    // Include all registered Taskin users even if they have no tasks
    try {
      const allUsers = this.userRegistry.getAllUsers?.() || [];
      for (const u of allUsers) {
        // Mesma chave que os assignees resolvidos usam: o id do registro
        upsert({ key: u.id, username: u.name || u.id });
      }
    } catch (error) {
      // If registry is unavailable, continue with existing contributors
      console.warn('Failed to include registry users in team metrics:', error);
    }

    // Include all git authors in the period, even if they have no tasks
    if (this.gitAnalyzer) {
      try {
        const authors = await this.gitAnalyzer.getAuthors({
          since: weekAgo.toISOString(),
          until: now.toISOString(),
        });

        for (const a of authors) {
          const name = a.name || a.email || 'unknown';
          // Autor de commit passa pelo mesmo registro, para o commit cair na
          // mesma pessoa que a task — antes so casava se a grafia coincidisse
          const identified = identify(name);
          if (identified) upsert(identified);
        }
      } catch (error) {
        console.warn('Failed to fetch git authors for team metrics:', error);
      }
    }

    // Calculate git metrics for each contributor
    for (const [_key, data] of contributors.entries()) {
      try {
        const codeMetrics = await calculateCodeMetrics(this.gitAnalyzer, data.username, weekAgo, now);
        data.commits = codeMetrics.commits;
        data.codeMetrics = codeMetrics;
      } catch (error) {
        console.error(`Failed to calculate metrics for ${data.username}:`, error);
      }
    }

    // Aggregate team totals
    const totalCommits = Array.from(contributors.values()).reduce((sum, c) => sum + c.commits, 0);
    const totalTasksCompleted =
      Array.from(contributors.values()).reduce((sum, c) => sum + c.tasksCompleted, 0) + unattributedTasksCompleted;
    const aggregatedCodeMetrics = Array.from(contributors.values()).reduce(
      (acc, c) => ({
        linesAdded: acc.linesAdded + c.codeMetrics.linesAdded,
        linesRemoved: acc.linesRemoved + c.codeMetrics.linesRemoved,
        netChange: acc.netChange + c.codeMetrics.netChange,
        characters: acc.characters + c.codeMetrics.characters,
        filesChanged: acc.filesChanged + c.codeMetrics.filesChanged,
        commits: acc.commits + c.codeMetrics.commits,
      }),
      emptyCodeMetrics(),
    );

    const team: TeamStats = {
      period: query?.period || 'week',
      periodStart: toISOString(weekAgo),
      periodEnd: toISOString(now),
      totalContributors: contributors.size,
      totalCommits,
      totalTasksCompleted,
      codeMetrics: aggregatedCodeMetrics,
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

  async getTaskMetrics(taskId: string, _query?: StatsQuery): Promise<TaskStats> {
    const tasks = await this.readTaskFiles();
    const found = tasks.find((t) => t.id === taskId || t.filePath.includes(taskId));
    const now = new Date();
    const validStatuses: readonly TaskStatus[] = TASK_STATUSES;

    const base = {
      taskId,
      title: found ? found.title : taskId,
      type: found?.type || 'feat',
      status: found?.status && validStatuses.includes(found.status) ? found.status : 'pending',
      assignee: found?.assignee,
      duration: 0,
      created: toISOString(now),
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
