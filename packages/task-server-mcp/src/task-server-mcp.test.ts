import { describe, expect, it } from 'vitest';
import { TaskMCPServer } from './index.js';

describe('TaskMCPServer', () => {
  it('should export TaskMCPServer class', () => {
    expect(TaskMCPServer).toBeDefined();
    expect(typeof TaskMCPServer).toBe('function');
  });

  it('should be instantiable', () => {
    const mockProvider = {
      getTasks: async () => [],
      getTask: async () => undefined,
      createTask: async () => ({ id: '1', title: 'Test' }),
      updateTask: async () => {},
      deleteTask: async () => {},
      startTask: async () => {},
      pauseTask: async () => {},
      finishTask: async () => {},
    };

    expect(() => new TaskMCPServer(mockProvider)).not.toThrow();
  });
});
