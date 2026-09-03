import type {
  CreateTaskOptions,
  CreateTaskResult,
  ITaskManager,
  ITaskProvider,
  LintResult,
} from '@opentask/taskin-task-manager';
import { parseTaskId, type Task, type TaskId } from '@opentask/taskin-types';
import type { TaskServerConfig, WebSocketServerOptions } from './task-server-ws.types.js';

const buildTask = (taskId: TaskId, overrides: Partial<Task> = {}): Task => ({
  id: taskId,
  title: `Task ${taskId}`,
  status: 'pending',
  type: 'feat',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock TaskManager for testing.
 *
 * Speaks plain `Task`: the server is generic over the provider's shape, so the
 * mocks have no reason to invent file system fields.
 */
export class MockTaskManager implements ITaskManager {
  async startTask(taskId: TaskId): Promise<Task> {
    return buildTask(taskId, { status: 'in-progress' });
  }

  async pauseTask(taskId: TaskId): Promise<Task> {
    return buildTask(taskId, { status: 'paused' });
  }

  async finishTask(taskId: TaskId): Promise<Task> {
    return buildTask(taskId, { status: 'done' });
  }

  async reviewTask(taskId: TaskId): Promise<Task> {
    return buildTask(taskId, { status: 'in-review' });
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult> {
    const taskId = parseTaskId('001');
    return {
      task: buildTask(taskId, { title: options.title, type: options.type }),
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
}

/**
 * Mock TaskProvider for testing
 */
export class MockTaskProvider implements ITaskProvider {
  async initialize(): Promise<void> {
    return;
  }
  private tasks: Task[] = [];

  constructor(initialTasks: Task[] = []) {
    this.tasks = initialTasks;
  }

  async findTask(taskId: TaskId): Promise<Task | undefined> {
    return this.tasks.find((t) => t.id === taskId);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.tasks;
  }

  async updateTask(task: Task): Promise<void> {
    const idx = this.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      this.tasks[idx] = task;
    } else {
      this.tasks.push(task);
    }
  }

  /**
   * Add tasks to the mock provider
   */
  addTasks(tasks: Task[]): void {
    this.tasks.push(...tasks);
  }

  /**
   * Clear all tasks
   */
  clearTasks(): void {
    this.tasks = [];
  }

  /**
   * Get all tasks (for testing)
   */
  getTasks(): Task[] {
    return this.tasks;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult> {
    const taskId = parseTaskId(String(this.tasks.length + 1).padStart(3, '0'));
    const task = buildTask(taskId, { title: options.title, type: options.type });
    this.tasks.push(task);
    return { task };
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
}

/**
 * Create mock server configuration
 */
export function createMockServerConfig(overrides?: Partial<TaskServerConfig>): TaskServerConfig {
  return {
    taskManager: new MockTaskManager(),
    taskProvider: new MockTaskProvider(),
    options: {
      port: 3001,
      host: 'localhost',
      debug: true,
    },
    ...overrides,
  };
}

/**
 * Create mock WebSocket server options
 */
export function createMockServerOptions(overrides?: Partial<WebSocketServerOptions>): WebSocketServerOptions {
  return {
    port: 0, // Random port for testing
    host: 'localhost',
    cors: true,
    maxClients: 10,
    heartbeatInterval: 1000, // Short interval for testing
    debug: false,
    ...overrides,
  };
}
