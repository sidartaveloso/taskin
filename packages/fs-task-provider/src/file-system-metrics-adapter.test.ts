import { promises as fs } from 'fs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemMetricsAdapter } from './file-system-metrics-adapter';

vi.mock('fs', () => ({ promises: { readdir: vi.fn(), readFile: vi.fn() } }));

const mockUserRegistry = {
  getUser: vi.fn(),
};

describe('FileSystemMetricsAdapter', () => {
  const TASKS_DIR = '/fake/tasks';
  let adapter: FileSystemMetricsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new FileSystemMetricsAdapter(TASKS_DIR, mockUserRegistry as any);
  });

  it('getUserMetrics counts completed and active tasks for user', async () => {
    const files = ['task-001-first.md', 'task-002-second.md'];
    const content1 = `# Task 001 — First Task\nStatus: done\nAssignee: john-doe`;
    const content2 = `# Task 002 — Second Task\nStatus: in-progress\nAssignee: john-doe`;

    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock)
      .mockResolvedValueOnce(content1)
      .mockResolvedValueOnce(content2);

    (mockUserRegistry.getUser as Mock).mockReturnValue({
      id: 'john-doe',
      name: 'John Doe',
    });

    const stats = await adapter.getUserMetrics('john-doe');

    expect(stats.username).toBe('John Doe');
    expect(stats.contributionMetrics.tasksCompleted).toBe(1);
    expect(stats.engagementMetrics.activeTasksCount).toBe(1);
  });

  it('getTaskMetrics returns basic task info', async () => {
    const files = ['task-007-abc.md'];
    const content = `# Task 007 — Important\nStatus: pending\nType: feat`;
    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock).mockResolvedValue(content);

    const t = await adapter.getTaskMetrics('007');
    expect(t.taskId).toBe('007');
    expect(t.title).toBe('Important');
    expect(t.status).toBe('pending');
  });

  it('getTeamMetrics counts contributors', async () => {
    const files = ['task-001-a.md', 'task-002-b.md'];
    const content1 = `# Task 001 — A\nStatus: done\nAssignee: alice`;
    const content2 = `# Task 002 — B\nStatus: pending\nAssignee: bob`;

    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock)
      .mockResolvedValueOnce(content1)
      .mockResolvedValueOnce(content2);

    const team = await adapter.getTeamMetrics('team-x');
    expect(team.totalContributors).toBeGreaterThanOrEqual(2);
    expect(team.totalTasksCompleted).toBeGreaterThanOrEqual(1);
  });
});
