import { parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it, vi } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';
import { createMockMCPServerConfig, mockToolCalls } from './task-server-mcp.mock.js';
import type { TaskStatusChange } from './task-server-mcp.types.js';

describe('TaskMCPServer — onStatusChange hook', () => {
  it('invokes the hook with the resulting status after start_task', async () => {
    const changes: TaskStatusChange[] = [];
    const server = new TaskMCPServer(
      createMockMCPServerConfig({ onStatusChange: (change) => void changes.push(change) }),
    );

    await server.callTool(mockToolCalls.startTask('001'));

    expect(changes).toEqual([{ taskId: parseTaskId('001'), status: 'in-progress' }]);
  });

  it('invokes the hook with the resulting status after finish_task', async () => {
    const changes: TaskStatusChange[] = [];
    const server = new TaskMCPServer(
      createMockMCPServerConfig({ onStatusChange: (change) => void changes.push(change) }),
    );

    await server.callTool(mockToolCalls.finishTask('001'));

    expect(changes).toEqual([{ taskId: parseTaskId('001'), status: 'done' }]);
  });

  it('does not invoke the hook for the read-only list_tasks', async () => {
    const onStatusChange = vi.fn();
    const server = new TaskMCPServer(createMockMCPServerConfig({ onStatusChange }));

    await server.callTool({ name: 'list_tasks', arguments: {} });

    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('does not invoke the hook when the status change fails', async () => {
    const onStatusChange = vi.fn();
    const server = new TaskMCPServer(createMockMCPServerConfig({ onStatusChange }));

    // 002 is already in-progress in the mock, so start_task throws.
    const result = await server.callTool(mockToolCalls.startTask('002'));

    expect(result.isError).toBe(true);
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('still succeeds when no hook is wired (pre-hook behavior)', async () => {
    const server = new TaskMCPServer(createMockMCPServerConfig());

    const result = await server.callTool(mockToolCalls.startTask('001'));

    expect(result.isError).toBeFalsy();
  });

  it('reports success even if the hook throws — the status already changed', async () => {
    const server = new TaskMCPServer(
      createMockMCPServerConfig({
        onStatusChange: () => {
          throw new Error('git exploded');
        },
      }),
    );

    const result = await server.callTool(mockToolCalls.startTask('001'));

    expect(result.isError).toBeFalsy();
  });
});
