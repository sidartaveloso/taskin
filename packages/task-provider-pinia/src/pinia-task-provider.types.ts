import type { TaskFile } from '@opentask/taskin-task-manager';

/**
 * Configuration for PiniaTaskProvider
 */
export interface PiniaTaskProviderConfig {
  /**
   * WebSocket server URL
   * @example 'ws://localhost:3001'
   */
  wsUrl: string;

  /**
   * Automatic reconnection enabled
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Reconnection delay in milliseconds
   * @default 5000
   */
  reconnectDelay?: number;

  /**
   * Maximum reconnection attempts (0 = infinite)
   * @default 0
   */
  maxReconnectAttempts?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  | 'list'
  | 'find'
  | 'update'
  | 'tasks'
  | 'task:found'
  | 'task:updated'
  | 'task:created'
  | 'task:deleted'
  | 'error'
  | 'ping'
  | 'pong';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  /** Message type */
  type: WebSocketMessageType;

  /** Message payload */
  payload?: T;

  /** Request ID for response correlation */
  requestId?: string;

  /** Timestamp */
  timestamp?: number;
}

/**
 * Pinia store state for task management
 */
export interface PiniaTaskStoreState {
  /** All cached tasks */
  tasks: TaskFile[];

  /** Loading state */
  loading: boolean;

  /** WebSocket connection status */
  connected: boolean;

  /** Connection error message */
  error: string | null;

  /** Reconnection attempt count */
  reconnectAttempts: number;

  /** Last sync timestamp */
  lastSync: number | null;
}

/**
 * Pinia store getters
 */
export interface PiniaTaskStoreGetters {
  /** Get task by ID */
  taskById: (
    state: PiniaTaskStoreState,
  ) => (id: string) => TaskFile | undefined;

  /** Get tasks by status */
  tasksByStatus: (state: PiniaTaskStoreState) => (status: string) => TaskFile[];

  /** Get connection status info */
  connectionStatus: (state: PiniaTaskStoreState) => {
    connected: boolean;
    error: string | null;
    reconnectAttempts: number;
  };
}

/**
 * Pinia store actions
 */
export interface PiniaTaskStoreActions {
  /** Connect to WebSocket server */
  connect(config: PiniaTaskProviderConfig): void;

  /** Disconnect from WebSocket server */
  disconnect(): void;

  /** Send WebSocket message */
  send(message: WebSocketMessage): void;

  /** Handle incoming WebSocket message */
  handleMessage(message: WebSocketMessage): void;

  /** Handle connection error */
  handleError(error: Error): void;

  /** Attempt reconnection */
  reconnect(): void;

  // ITaskProvider methods
  /** Find task by ID */
  findTask(taskId: string): Promise<TaskFile | undefined>;

  /** Get all tasks */
  getAllTasks(): Promise<TaskFile[]>;

  /** Update task */
  updateTask(task: TaskFile): Promise<void>;
}

/**
 * Complete Pinia store type
 */
export interface PiniaTaskStore
  extends PiniaTaskStoreState,
    PiniaTaskStoreGetters,
    PiniaTaskStoreActions {}
