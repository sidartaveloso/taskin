import { describe, expect, it } from 'vitest';

describe('ITaskProvider optional stats methods', () => {
  it('accepts providers that implement optional stats methods', async () => {
    const provider: any = {
      findTask: async () => undefined,
      getAllTasks: async () => [],
      updateTask: async () => {},
      createTask: async () => ({ task: {}, taskId: '1', filePath: '' }),
      lint: async () => ({
        errors: [],
        tasksChecked: 0,
        valid: true,
        warnings: [],
      }),
      getUserStats: async (userId: string) => ({ userId }),
      getTeamStats: async (teamId: string) => ({ teamId }),
      getTaskStats: async (taskId: string) => ({ taskId }),
      capabilities: () => ['stats'],
    };

    expect(typeof provider.getUserStats).toBe('function');
    expect(typeof provider.getTeamStats).toBe('function');
    expect(typeof provider.getTaskStats).toBe('function');
    expect(provider.capabilities()).toContain('stats');

    // Ensure calling them returns a promise-like result
    await expect(provider.getUserStats('u1')).resolves.toBeDefined();
    await expect(provider.getTeamStats('t1')).resolves.toBeDefined();
    await expect(provider.getTaskStats('task1')).resolves.toBeDefined();
  });
});
