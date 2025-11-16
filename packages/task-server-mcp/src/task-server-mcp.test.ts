import { describe, expect, it } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

describe('TaskMCPServer', () => {
  it('should export TaskMCPServer class', () => {
    expect(TaskMCPServer).toBeDefined();
    expect(typeof TaskMCPServer).toBe('function');
  });
});
