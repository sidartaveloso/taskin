import type { ITaskManager, ITaskProvider } from '@opentask/taskin-task-manager';
import type { TaskId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { TaskWebSocketServer } from './index.js';

describe('TaskWebSocketServer', () => {
  it('should export TaskWebSocketServer class', () => {
    expect(TaskWebSocketServer).toBeDefined();
    expect(typeof TaskWebSocketServer).toBe('function');
  });

  it('should be instantiable', () => {
    const mockTask = {
      id: '1' as TaskId,
      title: 'Test',
      type: 'feat' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      content: '# Test Task',
      filePath: '/test.md',
    };

    const mockProvider: ITaskProvider = {
      initialize: async () => {},
      findTask: async () => undefined,
      getAllTasks: async () => [],
      updateTask: async () => {},
      createTask: async () => ({
        task: mockTask as never,
        taskId: '1' as TaskId,
        filePath: '/test.md',
      }),
      lint: async () => ({
        valid: true,
        issues: [],
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
      }),
    };

    const mockManager: ITaskManager = {
      startTask: async () => mockTask as never,
      finishTask: async () => mockTask as never,
      reviewTask: async () => mockTask as never,
      createTask: async () => ({ task: mockTask, taskId: '1' as TaskId, filePath: '/test.md' }),
      lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    };

    expect(
      () =>
        new TaskWebSocketServer({
          taskProvider: mockProvider,
          taskManager: mockManager,
        }),
    ).not.toThrow();
  });
});
