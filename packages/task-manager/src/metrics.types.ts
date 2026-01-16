import type {
  StatsQuery,
  TaskStats,
  TeamStats,
  UserStats,
} from '@opentask/taskin-types';

/**
 * Manages metrics and statistics for users, teams, and tasks.
 * Aggregates data from Git history and task files to provide productivity insights.
 *
 * @remarks
 * This interface separates analytics/reporting responsibilities from ITaskProvider,
 * following the Single Responsibility Principle.
 *
 * @example
 * ```ts
 * const metrics = new FileSystemMetricsAdapter(tasksDir, userRegistry, gitAnalyzer);
 * const stats = await metrics.getUserMetrics('john-doe', { period: 'week' });
 * console.log(`Commits: ${stats.codeMetrics.commits}`);
 * ```
 *
 * @public
 */
export interface IMetricsManager {
  /**
   * Get productivity metrics for a specific user.
   *
   * Includes code metrics (commits, lines of code), temporal patterns
   * (day of week, time of day), and engagement statistics (completion rate, streaks).
   *
   * @param userId - User identifier (username or registry ID)
   * @param query - Optional query parameters to filter results
   * @param query.period - Time period to analyze ('day' | 'week' | 'month' | 'year')
   * @returns Promise resolving to user statistics
   *
   * @example
   * ```ts
   * const stats = await metrics.getUserMetrics('alice', { period: 'month' });
   * console.log(`Tasks completed: ${stats.contributionMetrics.tasksCompleted}`);
   * console.log(`Completion rate: ${(stats.engagementMetrics.completionRate * 100).toFixed(1)}%`);
   * ```
   */
  getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats>;

  /**
   * Get aggregated metrics for an entire team.
   *
   * Provides overview of team productivity with breakdown by individual contributors.
   * Useful for team retrospectives, capacity planning, and identifying top contributors.
   *
   * @param teamId - Team identifier
   * @param query - Optional query parameters to filter results
   * @returns Promise resolving to team statistics with per-contributor breakdown
   *
   * @example
   * ```ts
   * const stats = await metrics.getTeamMetrics('frontend', { period: 'week' });
   * console.log(`Total commits: ${stats.totalCommits}`);
   * console.log(`Contributors: ${stats.totalContributors}`);
   * stats.contributors.forEach(c => {
   *   console.log(`${c.username}: ${c.commits} commits, ${c.tasksCompleted} tasks`);
   * });
   * ```
   */
  getTeamMetrics(teamId: string, query?: StatsQuery): Promise<TeamStats>;

  /**
   * Get detailed metrics for a specific task.
   *
   * Includes timeline analysis, contributor activity, code impact metrics,
   * and work patterns. Useful for task retrospectives and understanding
   * effort distribution.
   *
   * @param taskId - Task identifier (task number like '015' or full ID like 'task-015')
   * @param query - Optional query parameters
   * @returns Promise resolving to task-specific statistics
   *
   * @example
   * ```ts
   * const stats = await metrics.getTaskMetrics('task-015', {});
   * console.log(`Duration: ${stats.duration} days`);
   * console.log(`Contributors: ${stats.contributors.map(c => c.name).join(', ')}`);
   * if (stats.refactoringMetrics) {
   *   console.log(`Simplification ratio: ${stats.refactoringMetrics.simplificationRatio.toFixed(2)}x`);
   * }
   * ```
   */
  getTaskMetrics(taskId: string, query?: StatsQuery): Promise<TaskStats>;
}

export type {
  TaskStats as TaskMetrics,
  TeamStats as TeamMetrics,
  UserStats as UserMetrics,
};
