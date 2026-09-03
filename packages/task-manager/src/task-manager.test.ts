import { parseTaskId, type Task } from '@opentask/taskin-types';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskManager } from './task-manager';
import { createMockTask, createMockTaskProvider } from './task-manager.mock';
import type { ITaskProvider } from './task-manager.types';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockTaskProvider: ITaskProvider;
  let mockTask: Task;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskProvider = createMockTaskProvider();
    mockTask = createMockTask();
    taskManager = new TaskManager(mockTaskProvider);
  });

  describe('startTask', () => {
    it('should start a pending task', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(mockTask);

      const updatedTask = await taskManager.startTask(parseTaskId('001'));

      expect(mockTaskProvider.findTask).toHaveBeenCalledWith('001');
      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'in-progress' }));
      expect(updatedTask.status).toBe('in-progress');
    });

    it('should throw an error if task is not found', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(undefined);
      await expect(taskManager.startTask(parseTaskId('999'))).rejects.toThrow("Task with ID '999' not found.");
    });

    it('should throw an error if task is already in progress', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      await expect(taskManager.startTask(parseTaskId('001'))).rejects.toThrow("Task '001' is already in progress.");
    });
  });

  describe('pauseTask', () => {
    it('should pause an in-progress task', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      const updatedTask = await taskManager.pauseTask(parseTaskId('001'));

      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'paused' }));
      expect(updatedTask.status).toBe('paused');
    });

    it('should throw an error if task is not found', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(undefined);

      await expect(taskManager.pauseTask(parseTaskId('999'))).rejects.toThrow("Task with ID '999' not found.");
    });

    it('should throw an error if task is not in-progress', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue({ ...mockTask, status: 'pending' as const });

      await expect(taskManager.pauseTask(parseTaskId('001'))).rejects.toThrow(
        "Task '001' must be in 'in-progress' status to be paused",
      );
    });

    it('should let startTask resume a paused task', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue({ ...mockTask, status: 'paused' as const });

      const updatedTask = await taskManager.startTask(parseTaskId('001'));

      expect(updatedTask.status).toBe('in-progress');
    });
  });

  describe('finishTask', () => {
    it('should finish an in-progress task', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      const updatedTask = await taskManager.finishTask(parseTaskId('001'));

      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'done' }));
      expect(updatedTask.status).toBe('done');
    });
  });

  describe('reviewTask', () => {
    it('should change status to in-review for an in-progress task', async () => {
      const inProgressTask = { ...mockTask, status: 'in-progress' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(inProgressTask);

      const updatedTask = await taskManager.reviewTask(parseTaskId('001'));

      expect(mockTaskProvider.findTask).toHaveBeenCalledWith('001');
      expect(mockTaskProvider.updateTask).toHaveBeenCalledWith(expect.objectContaining({ status: 'in-review' }));
      expect(updatedTask.status).toBe('in-review');
    });

    it('should throw an error if task is not found', async () => {
      (mockTaskProvider.findTask as Mock).mockResolvedValue(undefined);

      await expect(taskManager.reviewTask(parseTaskId('999'))).rejects.toThrow("Task with ID '999' not found.");
    });

    it('should throw an error if task is not in-progress', async () => {
      const pendingTask = { ...mockTask, status: 'pending' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(pendingTask);

      await expect(taskManager.reviewTask(parseTaskId('001'))).rejects.toThrow(
        "Task '001' must be in 'in-progress' status to be reviewed",
      );
    });

    it('should throw an error if task is already done', async () => {
      const doneTask = { ...mockTask, status: 'done' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(doneTask);

      await expect(taskManager.reviewTask(parseTaskId('001'))).rejects.toThrow(
        "Task '001' must be in 'in-progress' status to be reviewed",
      );
    });

    it('should throw an error if task is already in-review', async () => {
      const reviewTask = { ...mockTask, status: 'in-review' as const };
      (mockTaskProvider.findTask as Mock).mockResolvedValue(reviewTask);

      await expect(taskManager.reviewTask(parseTaskId('001'))).rejects.toThrow(
        "Task '001' must be in 'in-progress' status to be reviewed",
      );
    });
  });

  describe('provider-specific fields', () => {
    // The manager is generic over the provider's task shape, so extra fields a
    // provider carries (filePath/content for the file system, an issue number
    // for a tracker) must survive a status transition untouched.
    type ProviderTask = Task & { filePath: string; content: string };

    it('should preserve provider fields through a transition', async () => {
      const providerTask: ProviderTask = {
        ...createMockTask(),
        filePath: '/tasks/task-001.md',
        content: '# Task 001',
      };
      const provider = createMockTaskProvider() as unknown as ITaskProvider<ProviderTask>;
      (provider.findTask as Mock).mockResolvedValue(providerTask);

      const manager = new TaskManager(provider);
      const updated = await manager.startTask(parseTaskId('001'));

      expect(updated.filePath).toBe('/tasks/task-001.md');
      expect(updated.content).toBe('# Task 001');
      expect(updated.status).toBe('in-progress');
      expect(provider.updateTask).toHaveBeenCalledWith(expect.objectContaining({ filePath: '/tasks/task-001.md' }));
    });
  });

  describe('createTask', () => {
    it('should delegate task creation to provider', async () => {
      const createOptions = { title: 'New Task', type: 'feat' as const };
      const createResult = {
        task: mockTask,
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
      // Antes o assert batia no campo `taskId` do result, que dizia '002'
      // enquanto o `task` dizia outro id. Com um campo so, o teste tem que
      // devolver a task que ele afirma ter criado.
      const createResult = {
        task: createMockTask({ id: parseTaskId('002') }),
        filePath: '/tasks/task-002.md',
      };

      (mockTaskProvider.createTask as Mock).mockResolvedValue(createResult);

      const result = await taskManager.createTask(createOptions);

      expect(mockTaskProvider.createTask).toHaveBeenCalledWith(createOptions);
      expect(result.task.id).toBe('002');
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
