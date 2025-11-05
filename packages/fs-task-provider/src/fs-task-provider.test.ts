import type { TaskFile } from '@taskin/task-manager';
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
    it('should write updated content to the file', async () => {
      const mockTask: TaskFile = {
        content: 'new content',
        createdAt: new Date().toISOString(),
        filePath: '/fake/tasks/task-001.md',
        id: '001',
        status: 'pending',
        title: 'Test Task',
        type: 'feat',
      };
      await provider.updateTask(mockTask);
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockTask.filePath,
        mockTask.content,
      );
    });
  });
});
