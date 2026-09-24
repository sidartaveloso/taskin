import type { Task } from '@opentask/taskin-types';

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
  | OperacaoDoQuadro['type']
  | 'group:created'
  | 'tasks'
  | 'task:found'
  | 'task:updated'
  | 'task:created'
  | 'task:deleted'
  | 'error'
  | 'ping'
  | 'pong';

/**
 * O que cada operacao do quadro leva ao servidor.
 *
 * Os nomes sao os que `SUPERFICIES_DAS_OPERACOES` declara para o `ws`, mais o
 * `create-group` do registro de grupos. O servidor nao aceita mais `update`:
 * agrupar, priorizar e pontuar passam pelas mesmas operacoes do `ITaskManager`
 * que a CLI e o MCP usam (task-106).
 */
export interface PayloadsDasOperacoes {
  'set-priority': { taskId: string; priority: number };
  'set-difficulty': { taskId: string; difficulty: number };
  'assign-to-group': { taskId: string; groupId: string };
  'remove-from-group': { taskId: string };
  'move-before': { taskId: string; targetId: string };
  'move-after': { taskId: string; targetId: string };
  'create-group': { id: string; name: string };
}

/** Uma operacao do quadro, como vai pelo fio. */
export type OperacaoDoQuadro = {
  [K in keyof PayloadsDasOperacoes]: { type: K; payload: PayloadsDasOperacoes[K] };
}[keyof PayloadsDasOperacoes];

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
  tasks: Task[];

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
  taskById: (state: PiniaTaskStoreState) => (id: string) => Task | undefined;

  /** Get tasks by status */
  tasksByStatus: (state: PiniaTaskStoreState) => (status: string) => Task[];

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
  findTask(taskId: string): Promise<Task | undefined>;

  /** Get all tasks */
  getAllTasks(): Promise<Task[]>;

  /**
   * Sempre recusa: o servidor so aceita operacoes nomeadas. Existe porque o
   * store tambem se apresenta como `ITaskProvider`. Use {@link operar}.
   */
  updateTask(task: Task): Promise<void>;

  /** Manda uma operacao nomeada ao servidor, e ja a reflete no cache. */
  operar(operacao: OperacaoDoQuadro): void;
}

/**
 * Complete Pinia store type
 */
export interface PiniaTaskStore extends PiniaTaskStoreState, PiniaTaskStoreGetters, PiniaTaskStoreActions {}
