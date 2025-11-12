import type {
  ITaskManager,
  ITaskProvider,
  TaskFile,
} from '@opentask/taskin-task-manager';
import type { TaskId } from '@opentask/taskin-types';
import type {
  TaskServerConfig,
  WebSocketServerOptions,
} from './task-server-ws.types';

/**
 * Mock TaskManager for testing
 */
export class MockTaskManager implements ITaskManager {
  async startTask(taskId: string): Promise<TaskFile> {
    const task: TaskFile = {
      id: taskId as TaskId,
      title: `Task ${taskId}`,
      status: 'in-progress',
      type: 'feat',
      filePath: `./TASKS/task-${taskId}.md`,
      content: `# Task ${taskId}`,
      createdAt: new Date().toISOString(),
    };
    return task;
  }

  async finishTask(taskId: string): Promise<TaskFile> {
    const task: TaskFile = {
      id: taskId as TaskId,
      title: `Task ${taskId}`,
      status: 'done',
      type: 'feat',
      filePath: `./TASKS/task-${taskId}.md`,
      content: `# Task ${taskId}`,
      createdAt: new Date().toISOString(),
    };
    return task;
  }
}

/**
 * Mock TaskProvider for testing
 */
export class MockTaskProvider implements ITaskProvider {
  private tasks: TaskFile[] = [];

  constructor(initialTasks: TaskFile[] = []) {
    this.tasks = initialTasks;
  }

  async findTask(taskId: string): Promise<TaskFile | undefined> {
    return this.tasks.find((t) => t.id === taskId);
  }

  async getAllTasks(): Promise<TaskFile[]> {
    return this.tasks;
  }

  async updateTask(task: TaskFile): Promise<void> {
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
  addTasks(tasks: TaskFile[]): void {
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
  getTasks(): TaskFile[] {
    return this.tasks;
  }
}

/**
 * Create mock server configuration
 */
export function createMockServerConfig(
  overrides?: Partial<TaskServerConfig>,
): TaskServerConfig {
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
export function createMockServerOptions(
  overrides?: Partial<WebSocketServerOptions>,
): WebSocketServerOptions {
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
