import type { Task, TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';

/**
 * Create mock task for testing
 */
export function createMockTask(overrides?: Partial<Task>): Task {
  const defaultTask: Task = {
    id: '550e8400-e29b-41d4-a716-446655440000' as TaskId,
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the API',
    status: 'in-progress' as TaskStatus,
    type: 'feat' as TaskType,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  return { ...defaultTask, ...overrides };
}

/**
 * Create array of mock tasks
 */
export function createMockTasks(count: number = 5): Task[] {
  const statuses: TaskStatus[] = ['pending', 'in-progress', 'done', 'blocked'];
  const types: TaskType[] = ['feat', 'fix', 'docs', 'refactor'];

  return Array.from({ length: count }, (_, i) => {
    const id = `550e8400-e29b-41d4-a716-44665544000${i}` as TaskId;
    return createMockTask({
      id,
      title: `Task ${i + 1}`,
      status: statuses[i % statuses.length],
      type: types[i % types.length],
    });
  });
}

/**
 * Mock WebSocket for testing
 */
export class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  private messages: string[] = [];

  constructor(public url: string) {
    // Simulate connection after a delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    this.messages.push(data);
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  /**
   * Simulate receiving a message
   */
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  /**
   * Get sent messages
   */
  getSentMessages(): string[] {
    return this.messages;
  }

  /**
   * Clear sent messages
   */
  clearMessages(): void {
    this.messages = [];
  }
}

/**
 * Mock WebSocket server responses
 */
export const mockWebSocketResponses = {
  tasksList: (tasks: Task[]) => ({
    type: 'tasks',
    payload: tasks,
    timestamp: Date.now(),
  }),

  taskFound: (task: Task) => ({
    type: 'task:found',
    payload: task,
    timestamp: Date.now(),
  }),

  taskUpdated: (task: Task) => ({
    type: 'task:updated',
    payload: task,
    timestamp: Date.now(),
  }),

  taskCreated: (task: Task) => ({
    type: 'task:created',
    payload: task,
    timestamp: Date.now(),
  }),

  taskDeleted: (taskId: string) => ({
    type: 'task:deleted',
    payload: { id: taskId },
    timestamp: Date.now(),
  }),

  error: (message: string) => ({
    type: 'error',
    payload: { message },
    timestamp: Date.now(),
  }),

  pong: () => ({
    type: 'pong',
    timestamp: Date.now(),
  }),
};
