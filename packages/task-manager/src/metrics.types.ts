import type { UserStats, TeamStats, TaskStats, StatsQuery } from '@opentask/taskin-types';

/**
 * IMetricsManager - Interface dedicada para operações de métricas/estatísticas.
 * Separa responsabilidades de relatório/analytics do `ITaskProvider`.
 */
export interface IMetricsManager {
  getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats>;
  getTeamMetrics(teamId: string, query?: StatsQuery): Promise<TeamStats>;
  getTaskMetrics(taskId: string, query?: StatsQuery): Promise<TaskStats>;
}

export type { UserStats as UserMetrics, TeamStats as TeamMetrics, TaskStats as TaskMetrics };
