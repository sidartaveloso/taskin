import type {
  CreateTaskOptions,
  CreateTaskResult,
  ITaskManager,
  LintResult,
  TaskFile,
} from '@opentask/taskin-task-manager';
import type { MCPServerConfig } from './task-server-mcp.types.js';

/**
 * Mock TaskManager for MCP testing
 */
export class MockMCPTaskManager implements ITaskManager {
  private tasks: Map<string, TaskFile> = new Map();

  constructor() {
    // Add some mock tasks
    this.tasks.set('550e8400-e29b-41d4-a716-446655440001', {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication',
      status: 'pending',
      type: 'feat',
      filePath: './TASKS/task-001.md',
      content: '# Task 001',
      createdAt: new Date().toISOString(),
    });

    this.tasks.set('550e8400-e29b-41d4-a716-446655440002', {
      id: '550e8400-e29b-41d4-a716-446655440002' as TaskId,
      title: 'Fix login bug',
      description: 'Users cannot login with special characters',
      status: 'in-progress',
      type: 'fix',
      filePath: './TASKS/task-002.md',
      content: '# Task 002',
      createdAt: new Date().toISOString(),
    });
  }

  async startTask(taskId: string): Promise<TaskFile> {
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

  async finishTask(taskId: string): Promise<TaskFile> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'done';
    this.tasks.set(taskId, task);
    return task;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult> {
    const taskId = String(this.tasks.size + 1).padStart(3, '0');
    const task: TaskFile = {
      id: taskId as TaskId,
      title: options.title,
      status: 'pending',
      type: options.type,
      filePath: `./TASKS/task-${taskId}.md`,
      content: `# Task ${taskId}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, task);
    return {
      task,
      taskId,
      filePath: task.filePath,
    };
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
  getAllTasks(): TaskFile[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID (for testing)
   */
  getTask(taskId: string): TaskFile | undefined {
    return this.tasks.get(taskId);
  }
}

/**
 * Create mock MCP server configuration
 */
export function createMockMCPServerConfig(
  overrides?: Partial<MCPServerConfig>,
): MCPServerConfig {
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
