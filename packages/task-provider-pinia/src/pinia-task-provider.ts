import type { ITaskProvider, TaskFile } from '@opentask/taskin-task-manager';
import { defineStore } from 'pinia';
import type {
  PiniaTaskProviderConfig,
  PiniaTaskStoreState,
  WebSocketMessage,
} from './pinia-task-provider.types.js';

/**
 * WebSocket timing constants (in milliseconds)
 */
const DEFAULT_RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const TASK_REQUEST_TIMEOUT = 5000; // 5 seconds
const TASK_REQUEST_CHECK_INTERVAL = 100; // 100ms
const TASK_RESPONSE_DELAY = 500; // 500ms

// WebSocket instance storage (outside Pinia store)
const wsInstances = new Map<string, WebSocket>();
const wsConfigs = new Map<string, PiniaTaskProviderConfig>();
const heartbeatIntervals = new Map<string, NodeJS.Timeout>();
const lastPongs = new Map<string, number>();

/**
 * Pinia store context with typed this
 */
interface PiniaStoreContext extends PiniaTaskStoreState {
  $id: string;
  // Actions
  connect(config: PiniaTaskProviderConfig): void;
  _connect(): void;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  handleMessage(message: WebSocketMessage): void;
  handleError(error: Error): void;
  reconnect(): void;
  _startHeartbeat(): void;
  _stopHeartbeat(): void;
  _log(...args: unknown[]): void;
  findTask(taskId: string): Promise<TaskFile | undefined>;
  getAllTasks(): Promise<TaskFile[]>;
  updateTask(task: TaskFile): Promise<void>;
}

/**
 * Pinia store for task management with WebSocket synchronization
 */
const _usePiniaTaskProvider = defineStore('taskin-tasks', {
  state: (): PiniaTaskStoreState => ({
    tasks: [],
    loading: false,
    connected: false,
    error: null,
    reconnectAttempts: 0,
    lastSync: null,
  }),

  getters: {
    /**
     * Get task by ID
     */
    taskById(state: PiniaTaskStoreState) {
      return (id: string) => state.tasks.find((t: TaskFile) => t.id === id);
    },

    /**
     * Get tasks filtered by status
     */
    tasksByStatus(state: PiniaTaskStoreState) {
      return (status: string) =>
        state.tasks.filter((t: TaskFile) => t.status === status);
    },

    /**
     * Get connection status information
     */
    connectionStatus(state: PiniaTaskStoreState) {
      return {
        connected: state.connected,
        error: state.error,
        reconnectAttempts: state.reconnectAttempts,
      };
    },
  },

  actions: {
    /**
     * Connect to WebSocket server
     */
    connect(this: PiniaStoreContext, config: PiniaTaskProviderConfig): void {
      const storeId = this.$id;

      if (wsInstances.has(storeId)) {
        this.disconnect();
      }

      wsConfigs.set(storeId, {
        autoReconnect: true,
        reconnectDelay: DEFAULT_RECONNECT_DELAY,
        maxReconnectAttempts: 0,
        debug: false,
        ...config,
      });

      this._connect();
    },

    /**
     * Internal connection logic
     */
    _connect(this: PiniaStoreContext): void {
      const storeId = this.$id;
      const config = wsConfigs.get(storeId);

      if (!config) return;

      this._log('Connecting to', config.wsUrl);

      try {
        const ws = new WebSocket(config.wsUrl);
        wsInstances.set(storeId, ws);

        ws.onopen = () => {
          this._log('Connected');
          this.connected = true;
          this.error = null;
          this.reconnectAttempts = 0;

          // Request initial task list
          this.send({ type: 'list' });

          // Start heartbeat
          this._startHeartbeat();
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data as string);
            this.handleMessage(message);
          } catch (error) {
            this._log('Error parsing message:', error);
          }
        };

        ws.onerror = (event: Event) => {
          this._log('WebSocket error:', event);
          this.handleError(new Error('WebSocket connection error'));
        };

        ws.onclose = () => {
          this._log('Disconnected');
          this.connected = false;
          this._stopHeartbeat();

          // Attempt reconnection if enabled
          if (config.autoReconnect) {
            this.reconnect();
          }
        };
      } catch (error) {
        this.handleError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },

    /**
     * Disconnect from WebSocket server
     */
    disconnect(this: PiniaStoreContext): void {
      const storeId = this.$id;
      this._log('Disconnecting');
      this._stopHeartbeat();

      const ws = wsInstances.get(storeId);
      if (ws) {
        // Prevent auto-reconnect
        const config = wsConfigs.get(storeId);
        if (config) {
          config.autoReconnect = false;
        }

        ws.close();
        wsInstances.delete(storeId);
      }

      this.connected = false;
    },

    /**
     * Send message to WebSocket server
     */
    send(this: PiniaStoreContext, message: WebSocketMessage): void {
      const storeId = this.$id;
      const ws = wsInstances.get(storeId);

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        this._log('Cannot send message: not connected');
        return;
      }

      const msg: WebSocketMessage = {
        ...message,
        timestamp: Date.now(),
      };

      this._log('Sending:', msg);
      ws.send(JSON.stringify(msg));
    },

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(this: PiniaStoreContext, message: WebSocketMessage): void {
      this._log('Received:', message);

      switch (message.type) {
        case 'tasks':
          // Full task list received
          this.tasks = (message.payload as TaskFile[]) || [];
          this._log('Received tasks:', this.tasks.length);
          // Debug first task
          if (this.tasks.length > 0) {
            this._log(
              'First task sample:',
              JSON.stringify(this.tasks[0], null, 2),
            );
          }
          this.lastSync = Date.now();
          this.loading = false;
          break;

        case 'task:found':
          // Single task response
          if (message.payload) {
            const task = message.payload as TaskFile;
            const idx = this.tasks.findIndex((t: TaskFile) => t.id === task.id);
            if (idx >= 0) {
              this.tasks[idx] = task;
            } else {
              this.tasks.push(task);
            }
          }
          break;

        case 'task:updated':
          // Task was updated
          if (message.payload) {
            const task = message.payload as TaskFile;
            const idx = this.tasks.findIndex((t: TaskFile) => t.id === task.id);
            if (idx >= 0) {
              this.tasks[idx] = task;
            }
          }
          break;

        case 'task:created':
          // New task created
          if (message.payload) {
            const task = message.payload as TaskFile;
            this.tasks.push(task);
          }
          break;

        case 'task:deleted':
          // Task was deleted
          if (message.payload) {
            const taskId = (message.payload as { id: string }).id;
            this.tasks = this.tasks.filter((t: TaskFile) => t.id !== taskId);
          }
          break;

        case 'error':
          // Error from server
          this.error =
            (message.payload as { message: string })?.message ||
            'Unknown error';
          this._log('Server error:', this.error);
          break;

        case 'pong':
          // Heartbeat response
          lastPongs.set(this.$id, Date.now());
          break;

        default:
          this._log('Unknown message type:', message.type);
      }
    },

    /**
     * Handle connection error
     */
    handleError(this: PiniaStoreContext, error: Error): void {
      this._log('Error:', error.message);
      this.error = error.message;
      this.connected = false;
    },

    /**
     * Attempt reconnection
     */
    reconnect(this: PiniaStoreContext): void {
      const config = wsConfigs.get(this.$id);
      if (!config) return;

      const maxAttempts = config.maxReconnectAttempts || 0;
      if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
        this._log('Max reconnection attempts reached');
        this.error = 'Max reconnection attempts reached';
        return;
      }

      this.reconnectAttempts++;
      const delay = config.reconnectDelay || DEFAULT_RECONNECT_DELAY;

      this._log(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );

      setTimeout(() => {
        this._connect();
      }, delay);
    },

    /**
     * Start heartbeat to keep connection alive
     */
    _startHeartbeat(this: PiniaStoreContext): void {
      const storeId = this.$id;
      this._stopHeartbeat();

      lastPongs.set(storeId, Date.now());
      const interval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastPong = now - (lastPongs.get(storeId) || now);

        // If no pong for 30 seconds, consider connection dead
        if (timeSinceLastPong > HEARTBEAT_TIMEOUT) {
          this._log('Heartbeat timeout, reconnecting');
          this.disconnect();
          this.reconnect();
          return;
        }

        this.send({ type: 'ping' });
      }, HEARTBEAT_INTERVAL); // Send ping every 10 seconds

      heartbeatIntervals.set(storeId, interval);
    },

    /**
     * Stop heartbeat
     */
    _stopHeartbeat(this: PiniaStoreContext): void {
      const storeId = this.$id;
      const interval = heartbeatIntervals.get(storeId);

      if (interval) {
        clearInterval(interval);
        heartbeatIntervals.delete(storeId);
      }
    },

    /**
     * Debug logging
     */
    _log(this: PiniaStoreContext, ...args: unknown[]): void {
      const config = wsConfigs.get(this.$id);
      if (config?.debug) {
        console.log('[PiniaTaskProvider]', ...args);
      }
    },

    // ========================================
    // ITaskProvider interface implementation
    // ========================================

    /**
     * Find a task by ID
     */
    async findTask(this: PiniaStoreContext, taskId: string): Promise<TaskFile | undefined> {
      // Check cache first
      const cached = this.tasks.find((t: TaskFile) => t.id === taskId);
      if (cached) {
        return cached;
      }

      // Request from server if connected
      if (this.connected) {
        return new Promise((resolve) => {
          const requestId = `find-${taskId}-${Date.now()}`;

          // Set timeout
          const timeout = setTimeout(() => {
            resolve(undefined);
          }, TASK_REQUEST_TIMEOUT);

          // Listen for response via message handler
          this.send({ type: 'find', payload: { taskId }, requestId });

          // Note: Response will be handled by handleMessage
          // In a production implementation, you'd use a more sophisticated
          // request/response correlation mechanism
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(this.tasks.find((t: TaskFile) => t.id === taskId));
          }, TASK_RESPONSE_DELAY);
        });
      }

      return undefined;
    },

    /**
     * Get all tasks
     */
    async getAllTasks(this: PiniaStoreContext): Promise<TaskFile[]> {
      // Return cached tasks if available
      if (this.tasks.length > 0) {
        return this.tasks;
      }

      // Request from server if connected
      if (this.connected) {
        this.loading = true;
        this.send({ type: 'list' });

        // Wait for response (with timeout)
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            this.loading = false;
            resolve(this.tasks);
          }, TASK_REQUEST_TIMEOUT);

          // Check periodically if tasks are loaded
          const checkInterval = setInterval(() => {
            if (!this.loading || this.tasks.length > 0) {
              clearTimeout(timeout);
              clearInterval(checkInterval);
              this.loading = false;
              resolve(this.tasks);
            }
          }, TASK_REQUEST_CHECK_INTERVAL);
        });
      }

      return this.tasks;
    },

    /**
     * Update a task
     */
    async updateTask(this: PiniaStoreContext, task: TaskFile): Promise<void> {
      if (!this.connected) {
        throw new Error('Not connected to server');
      }

      // Optimistically update cache
      const idx = this.tasks.findIndex((t: TaskFile) => t.id === task.id);
      if (idx >= 0) {
        this.tasks[idx] = task;
      }

      // Send update to server
      this.send({ type: 'update', payload: task });
    },
  },
});

/**
 * Export Pinia store with proper typing
 * Type is fully inferred from defineStore and PiniaStoreContext
 */
export const usePiniaTaskProvider = _usePiniaTaskProvider;

/**
 * Create an ITaskProvider adapter for the Pinia store
 */
export function createPiniaTaskProvider(
  config: PiniaTaskProviderConfig,
): ITaskProvider {
  const store = _usePiniaTaskProvider();

  // Connect on creation
  store.connect(config);

  return {
    findTask: (taskId: string) => store.findTask(taskId),
    getAllTasks: () => store.getAllTasks(),
    updateTask: (task: TaskFile) => store.updateTask(task),
    createTask: async () => {
      throw new Error(
        'createTask not supported in Pinia provider (WebSocket-based)',
      );
    },
    lint: async () => ({
      valid: true,
      issues: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
    }),
  };
}
