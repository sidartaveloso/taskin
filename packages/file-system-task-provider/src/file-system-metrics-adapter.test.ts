import { promises as fs } from 'fs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemMetricsAdapter } from './file-system-metrics-adapter';

vi.mock('fs', () => ({ promises: { readdir: vi.fn(), readFile: vi.fn() } }));

const mockUserRegistry = {
  getUser: vi.fn(),
  getAllUsers: vi.fn(),
};

describe('FileSystemMetricsAdapter', () => {
  const TASKS_DIR = '/fake/tasks';
  let adapter: FileSystemMetricsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new FileSystemMetricsAdapter(
      TASKS_DIR,
      mockUserRegistry as any,
      undefined,
    );
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

  it('includes git authors and registry users in team metrics', async () => {
    const files = ['task-001-a.md'];
    const content1 = `# Task 001 — A\nStatus: done\nAssignee: alice`;

    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock).mockResolvedValueOnce(content1);

    // mock registry to return a user 'carol'
    (mockUserRegistry.getAllUsers as Mock).mockReturnValue([
      { id: 'carol', name: 'Carol' },
    ]);

    // mock gitAnalyzer with getAuthors
    const mockGitAnalyzer: any = {
      getAuthors: vi
        .fn()
        .mockResolvedValue([
          { name: 'Dave', email: 'dave@example.com', commits: 3 },
        ]),
      getCommits: vi.fn().mockResolvedValue([]),
    };

    adapter = new FileSystemMetricsAdapter(
      TASKS_DIR,
      mockUserRegistry as any,
      mockGitAnalyzer,
    );

    const team = await adapter.getTeamMetrics('team-x');

    const contributorNames = team.contributors.map((c) => c.username);
    // should contain task assignee 'alice', registry user 'Carol' and git author 'Dave'
    expect(contributorNames).toContain('alice');
    expect(contributorNames).toContain('Carol');
    expect(contributorNames).toContain('Dave');
  });

  it('should ignore Assignee field inside code blocks', async () => {
    const files = ['task-001-real.md', 'task-002-summary.md'];
    const realTask = `# Task 001 — Real Task
Status: done
Assignee: alice

## Description
This is a real task.`;

    // This document has NO real Assignee, only one inside code block
    const summaryWithCodeBlock = `# Task 002 — Summary Document
Status: done

## Example

\`\`\`typescript
const content = \`# Task 001 — Already Fixed
Status: done
Type: feat
Assignee: John Doe

## Description
Already in inline format.\`;
\`\`\`

More content here.`;

    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock)
      .mockResolvedValueOnce(realTask)
      .mockResolvedValueOnce(summaryWithCodeBlock);

    // Mock registry and git to return empty to avoid extra contributors
    (mockUserRegistry.getAllUsers as Mock).mockReturnValue([]);

    const team = await adapter.getTeamMetrics('team-x');

    // Should only count alice (real assignee), NOT John Doe from code block
    const contributorNames = team.contributors.map((c) => c.username);
    expect(contributorNames).toContain('alice');
    expect(contributorNames).not.toContain('John Doe');
    // Should have alice + unknown (task-002 without assignee)
    expect(team.totalContributors).toBe(2);
  });

  it('should ignore Status and Type fields inside code blocks', async () => {
    const files = ['task-001-doc.md'];

    // Task is actually pending, but has done/feat in code block
    const taskWithCodeExample = `# Task 001 — Documentation
Status: pending
Type: docs

## Example of task format

\`\`\`markdown
# Task Example
Status: done
Type: feat
Assignee: Someone
\`\`\`

This shows the format.`;

    (fs.readdir as Mock).mockResolvedValue(files);
    (fs.readFile as Mock).mockResolvedValue(taskWithCodeExample);

    const taskMetrics = await adapter.getTaskMetrics('001');

    // Should read actual status/type, NOT from code block
    expect(taskMetrics.status).toBe('pending');
    expect(taskMetrics.type).toBe('docs');
  });
});
