import { describe, expect, it } from 'vitest';
import type { IMetricsManager } from './metrics.types';

describe('IMetricsManager contract', () => {
  it('accepts an object implementing IMetricsManager', async () => {
    const metrics: IMetricsManager = {
      getUserMetrics: async (userId: string) => ({ userId } as any),
      getTeamMetrics: async (teamId: string) => ({ teamId } as any),
      getTaskMetrics: async (taskId: string) => ({ taskId } as any),
    };

    expect(typeof metrics.getUserMetrics).toBe('function');
    expect(typeof metrics.getTeamMetrics).toBe('function');
    expect(typeof metrics.getTaskMetrics).toBe('function');

    await expect(metrics.getUserMetrics('u1')).resolves.toBeDefined();
    await expect(metrics.getTeamMetrics('t1')).resolves.toBeDefined();
    await expect(metrics.getTaskMetrics('task1')).resolves.toBeDefined();
  });
});
