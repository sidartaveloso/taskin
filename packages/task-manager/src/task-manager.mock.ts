import { vi } from 'vitest';
import type { ITaskProvider, TaskFile } from './task-manager.types';

export const createMockTask = (overrides?: Partial<TaskFile>): TaskFile => ({
  content: '# Task 001 - Implement feature',
  createdAt: new Date().toISOString(),
  description: 'A test feature',
  filePath: '/tasks/task-001.md',
  id: 'task-001',
  status: 'pending',
  title: 'Implement feature',
  type: 'feat',
  userId: 'user-123',
  ...overrides,
});

export const createMockTaskProvider = (): ITaskProvider => ({
  findTask: vi.fn(),
  getAllTasks: vi.fn(),
  updateTask: vi.fn(),
});
