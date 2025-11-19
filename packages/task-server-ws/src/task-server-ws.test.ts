import { describe, expect, it } from 'vitest';
import { TaskWebSocketServer } from './index.js';

describe('TaskWebSocketServer', () => {
  it('should export TaskWebSocketServer class', () => {
    expect(TaskWebSocketServer).toBeDefined();
    expect(typeof TaskWebSocketServer).toBe('function');
  });

  it('should be instantiable', () => {
    const mockProvider = {
      getTasks: async () => [],
      getTask: async () => undefined,
      createTask: async () => ({ id: '1', title: 'Test' }),
      updateTask: async () => {},
      deleteTask: async () => {},
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
