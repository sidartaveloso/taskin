import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskManager } from './task-manager';
import { createMockTask, createMockTaskProvider } from './task-manager.mock';
import type { ITaskProvider, TaskFile } from './task-manager.types';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockTaskProvider: ITaskProvider;
  let mockTask: TaskFile;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskProvider = createMockTaskProvider();
    mockTask = createMockTask();
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

  describe('createTask', () => {
    it('should delegate task creation to provider', async () => {
      const createOptions = { title: 'New Task', type: 'feat' as const };
      const createResult = {
        task: mockTask,
        taskId: '001',
        filePath: '/tasks/task-001.md',
      };

      (mockTaskProvider.createTask as Mock).mockResolvedValue(createResult);

      const result = await taskManager.createTask(createOptions);

      expect(mockTaskProvider.createTask).toHaveBeenCalledWith(createOptions);
      expect(result).toEqual(createResult);
    });

    it('should pass through description and assignee to provider', async () => {
      const createOptions = {
        title: 'New Task',
        type: 'fix' as const,
        description: 'Fix something',
        assignee: 'john-doe',
      };
      const createResult = {
        task: mockTask,
        taskId: '002',
        filePath: '/tasks/task-002.md',
      };

      (mockTaskProvider.createTask as Mock).mockResolvedValue(createResult);

      const result = await taskManager.createTask(createOptions);

      expect(mockTaskProvider.createTask).toHaveBeenCalledWith(createOptions);
      expect(result.taskId).toBe('002');
    });
  });

  describe('lint', () => {
    it('should delegate lint without fix to provider', async () => {
      const lintResult = { errors: 0, warnings: 2, details: [] };
      (mockTaskProvider.lint as Mock).mockResolvedValue(lintResult);

      const result = await taskManager.lint();

      expect(mockTaskProvider.lint).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(lintResult);
    });

    it('should delegate lint with fix=true to provider', async () => {
      const lintResult = { errors: 0, warnings: 0, details: [] };
      (mockTaskProvider.lint as Mock).mockResolvedValue(lintResult);

      const result = await taskManager.lint(true);

      expect(mockTaskProvider.lint).toHaveBeenCalledWith(true);
      expect(result).toEqual(lintResult);
    });

    it('should delegate lint with fix=false to provider', async () => {
      const lintResult = { errors: 1, warnings: 2, details: [] };
      (mockTaskProvider.lint as Mock).mockResolvedValue(lintResult);

      const result = await taskManager.lint(false);

      expect(mockTaskProvider.lint).toHaveBeenCalledWith(false);
      expect(result).toEqual(lintResult);
    });
  });
});
