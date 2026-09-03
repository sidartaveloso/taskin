import { parseTaskId, type Task } from '@opentask/taskin-types';
import { vi } from 'vitest';
import type { ITaskProvider } from './task-manager.types';

export const createMockTask = (overrides?: Partial<Task>): Task => ({
  createdAt: new Date().toISOString(),
  description: 'A test feature',
  id: parseTaskId('001'),
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
  createTask: vi.fn(),
  lint: vi.fn(),
  initialize: vi.fn(),
});
