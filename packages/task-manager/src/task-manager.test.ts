import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskManager } from './task-manager';
import type { ITaskProvider, TaskFile } from './task.types';

const mockTask: TaskFile = {
  createdAt: new Date().toISOString(),
  content: '# Task 001 - Implement feature',
  description: 'A test feature',
  filePath: '/tasks/task-001.md',
  id: 'task-001',
  status: 'pending',
  title: 'Implement feature',
  type: 'feat',
  userId: 'user-123',
};

const mockTaskProvider: ITaskProvider = {
  findTask: vi.fn(),
  getAllTasks: vi.fn(),
  updateTask: vi.fn(),
};

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    vi.clearAllMocks();
    taskManager = new TaskManager(mockTaskProvider);
  });

  describe('startTask', () => {
    it('should start a pending task', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(mockTask);

      const updatedTask = await taskManager.startTask('task-001');

      expect(mockTaskProvider.findTask).toHaveBeenCalledWith('task-001');
      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in-progress' }),
      );
      expect(updatedTask.status).toBe('in-progress');
    });

    it('should throw an error if task is not found', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(undefined);
      await expect(taskManager.startTask('not-found')).rejects.toThrow(
        "Task with ID 'not-found' not found.",
      );
    });

    it('should throw an error if task is already in progress', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      await expect(taskManager.startTask('task-001')).rejects.toThrow(
        "Task 'task-001' is already in progress.",
      );
    });
  });

  describe('finishTask', () => {
    it('should finish an in-progress task', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      const updatedTask = await taskManager.finishTask('task-001');

      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'done' }),
      );
      expect(updatedTask.status).toBe('done');
    });
  });
});
