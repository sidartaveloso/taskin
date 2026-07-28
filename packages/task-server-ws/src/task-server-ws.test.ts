import { describe, expect, it } from 'vitest';
import { TaskWebSocketServer } from './index.js';
import { createMockServerConfig, MockTaskManager, MockTaskProvider } from './task-server-ws.mock.js';

describe('TaskWebSocketServer', () => {
  it('should export TaskWebSocketServer class', () => {
    expect(TaskWebSocketServer).toBeDefined();
    expect(typeof TaskWebSocketServer).toBe('function');
  });

  it('should be instantiable', () => {
    expect(
      () =>
        new TaskWebSocketServer({
          taskProvider: new MockTaskProvider(),
          taskManager: new MockTaskManager(),
        }),
    ).not.toThrow();
  });

  it('should be instantiable from the mock config', () => {
    expect(() => new TaskWebSocketServer(createMockServerConfig())).not.toThrow();
  });
});
