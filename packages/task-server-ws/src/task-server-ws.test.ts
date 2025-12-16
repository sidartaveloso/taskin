import { describe, expect, it } from 'vitest';
import { TaskWebSocketServer } from './index.js';

describe('TaskWebSocketServer', () => {
  it('should export TaskWebSocketServer class', () => {
    expect(TaskWebSocketServer).toBeDefined();
    expect(typeof TaskWebSocketServer).toBe('function');
  });

  it('should be instantiable', () => {
    const mockTask = {
      id: '1' as any,
      title: 'Test',
      type: 'feat' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      content: '# Test Task',
      filePath: '/test.md',
    };

    const mockProvider = {
      getTasks: async () => [],
      getTask: async () => undefined,
      createTask: async () => ({
        task: mockTask,
        taskId: '1',
        filePath: '/test.md',
      }),
      updateTask: async () => {},
      deleteTask: async () => {},
      findTask: async () => undefined,
      getAllTasks: async () => [],
      lint: async () => ({
        valid: true,
        issues: [],
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
      }),
    };

    const mockManager = {
      startTask: async () => {},
      pauseTask: async () => {},
      finishTask: async () => {},
    };

    expect(
      () =>
        new TaskWebSocketServer({
          taskProvider: mockProvider,
          taskManager: mockManager as any,
        }),
    ).not.toThrow();
  });
});
