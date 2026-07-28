import type { CreateTaskOptions, CreateTaskResult, ITaskManager, LintResult } from '@opentask/taskin-task-manager';
import type { Task, TaskId } from '@opentask/taskin-types';
import type { MCPServerConfig } from './task-server-mcp.types.js';

/**
 * Mock TaskManager for MCP testing.
 *
 * The MCP server only ever exposes id/title/status/type, so the mock stores
 * plain `Task` — there is nothing file-shaped for it to model.
 */
export class MockMCPTaskManager implements ITaskManager {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    // Add some mock tasks
    this.tasks.set('550e8400-e29b-41d4-a716-446655440001', {
      id: '550e8400-e29b-41d4-a716-446655440001' satisfies string as TaskId,
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication',
      status: 'pending',
      type: 'feat',
      createdAt: new Date().toISOString(),
    });

    this.tasks.set('550e8400-e29b-41d4-a716-446655440002', {
      id: '550e8400-e29b-41d4-a716-446655440002' satisfies string as TaskId,
      title: 'Fix login bug',
      description: 'Users cannot login with special characters',
      status: 'in-progress',
      type: 'fix',
      createdAt: new Date().toISOString(),
    });
  }

  async startTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'in-progress') {
      throw new Error(`Task ${taskId} is already in progress`);
    }

    if (task.status === 'done') {
      throw new Error(`Task ${taskId} is already done`);
    }

    task.status = 'in-progress';
    this.tasks.set(taskId, task);
    return task;
  }

  async pauseTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(`Task must be in 'in-progress' status to be paused`);
    }

    task.status = 'paused';
    this.tasks.set(taskId, task);
    return task;
  }

  async finishTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'done';
    this.tasks.set(taskId, task);
    return task;
  }

  async reviewTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(`Task must be in 'in-progress' status to be reviewed`);
    }

    task.status = 'in-review';
    this.tasks.set(taskId, task);
    return task;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult> {
    const taskId = String(this.tasks.size + 1).padStart(3, '0');
    const task: Task = {
      id: taskId satisfies string as TaskId,
      title: options.title,
      status: 'pending',
      type: options.type,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, task);
    return { task, taskId };
  }

  async lint(): Promise<LintResult> {
    return {
      valid: true,
      issues: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
    };
  }

  /**
   * Get all tasks (for testing)
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID (for testing)
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }
}

/**
 * Create mock MCP server configuration
 */
export function createMockMCPServerConfig(overrides?: Partial<MCPServerConfig>): MCPServerConfig {
  return {
    taskManager: new MockMCPTaskManager(),
    name: 'test-mcp-server',
    version: '0.0.1',
    debug: true,
    ...overrides,
  };
}

/**
 * Mock tool call scenarios
 */
export const mockToolCalls = {
  startTask: (taskId: string) => ({
    name: 'start_task',
    arguments: { taskId },
  }),

  finishTask: (taskId: string) => ({
    name: 'finish_task',
    arguments: { taskId },
  }),
};

/**
 * Mock prompt scenarios
 */
export const mockPromptRequests = {
  startWorkflow: (taskId: string) => ({
    name: 'start-task-workflow',
    arguments: { taskId },
  }),

  finishWorkflow: (taskId: string) => ({
    name: 'finish-task-workflow',
    arguments: { taskId },
  }),

  taskSummary: (taskId: string) => ({
    name: 'task-summary',
    arguments: { taskId },
  }),
};
