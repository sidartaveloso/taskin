import type { TaskFile } from '@opentask/taskin-task-manager';
import type { TaskId } from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemTaskProvider } from './fs-task-provider';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('FileSystemTaskProvider', () => {
  let provider: FileSystemTaskProvider;
  const TASKS_DIR = '/fake/tasks';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new FileSystemTaskProvider(TASKS_DIR);
  });

  describe('findTask', () => {
    it('should find and parse a task file', async () => {
      (fs.readdir as Mock).mockResolvedValue(['task-001-do-stuff.md']);
      (fs.readFile as Mock).mockResolvedValue('# Task 001 - Do Stuff');

      const task = await provider.findTask('001');

      expect(task).toBeDefined();
      expect(task?.id).toBe('001');
      expect(task?.title).toBe('Do Stuff');
      expect(fs.readdir).toHaveBeenCalledWith(TASKS_DIR);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/fake/tasks/task-001-do-stuff.md',
        'utf-8',
      );
    });

    it('should return undefined if task file is not found', async () => {
      (fs.readdir as Mock).mockResolvedValue(['task-002-other-stuff.md']);
      const task = await provider.findTask('001');
      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update the Status field in the file', async () => {
      const originalContent = `# Task 001 — Test Task

Status: pending
Type: feat
Assignee: Test User

## Description
Test description`;

      const expectedContent = `# Task 001 — Test Task

Status: in-progress
Type: feat
Assignee: Test User

## Description
Test description`;

      (fs.readFile as Mock).mockResolvedValue(originalContent);

      const mockTask: TaskFile = {
        content: 'not used in updateTask',
        createdAt: new Date().toISOString(),
        filePath: '/fake/tasks/task-001.md',
        id: '001' satisfies string as TaskId,
        status: 'in-progress',
        title: 'Test Task',
        type: 'feat',
      };

      await provider.updateTask(mockTask);

      expect(fs.readFile).toHaveBeenCalledWith(mockTask.filePath, 'utf-8');
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockTask.filePath,
        expectedContent,
        'utf-8',
      );
    });
  });
});
