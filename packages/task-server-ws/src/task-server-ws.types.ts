import type {
  ITaskManager,
  ITaskProvider,
} from '@opentask/taskin-task-manager';
import type { WebSocket as WSType } from 'ws';

/**
 * WebSocket server configuration
 */
export interface TaskServerConfig {
  /**
   * TaskManager instance to expose via WebSocket
   */
  taskManager: ITaskManager;

  /**
   * TaskProvider instance for reading tasks
   */
  taskProvider: ITaskProvider;

  /**
   * Server options
   */
  options?: WebSocketServerOptions;
}

/**
 * WebSocket server options
 */
export interface WebSocketServerOptions {
  /**
   * Port to listen on
   * @default 3001
   */
  port?: number;

  /**
   * Host to bind to
   * @default 'localhost'
   */
  host?: string;

  /**
   * Enable CORS
   * @default true
   */
  cors?: boolean;

  /**
   * Maximum clients
   * @default 100
   */
  maxClients?: number;

  /**
   * Heartbeat interval in milliseconds
   * @default 30000
   */
  heartbeatInterval?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Client connection information
 */
export interface ClientConnection {
  /**
   * Unique client ID
   */
  id: string;

  /**
   * WebSocket connection
   */
  ws: WSType;

  /**
   * Connection timestamp
   */
  connectedAt: number;

  /**
   * Last activity timestamp
   */
  lastActivity: number;

  /**
   * Is alive (for heartbeat)
   */
  isAlive: boolean;
}

/**
 * WebSocket message types (server-side)
 */
export type WSMessageType =
  | 'list'
  | 'find'
  | 'update'
  | 'start'
  | 'finish'
  | 'pause'
  | 'tasks'
  | 'task:found'
  | 'task:updated'
  | 'task:created'
  | 'task:deleted'
  | 'error'
  | 'ping'
  | 'pong';

/**
 * WebSocket message structure (server-side)
 */
export interface WSMessage<T = unknown> {
  /** Message type */
  type: WSMessageType;

  /** Message payload */
  payload?: T;

  /** Request ID for response correlation */
  requestId?: string;

  /** Timestamp */
  timestamp?: number;
}

/**
 * Server event types
 */
export interface TaskServerEvents {
  /** Client connected */
  'client:connected': (client: ClientConnection) => void;

  /** Client disconnected */
  'client:disconnected': (clientId: string) => void;

  /** Message received from client */
  'message:received': (client: ClientConnection, message: WSMessage) => void;

  /** Error occurred */
  error: (error: Error) => void;

  /** Server started */
  started: (port: number, host: string) => void;

  /** Server stopped */
  stopped: () => void;
}

/**
 * Task server interface
 */
export interface ITaskServer {
  /**
   * Start the WebSocket server
   */
  start(): Promise<void>;

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void>;

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WSMessage): void;

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WSMessage): void;

  /**
   * Get all connected clients
   */
  getClients(): ClientConnection[];

  /**
   * Get server status
   */
  getStatus(): {
    running: boolean;
    clients: number;
    port: number;
    host: string;
  };
}
