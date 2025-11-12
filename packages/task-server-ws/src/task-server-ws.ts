import type {
  ITaskManager,
  ITaskProvider,
  TaskFile,
} from '@opentask/taskin-task-manager';
import { randomUUID } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  ClientConnection,
  ITaskServer,
  TaskServerConfig,
  WebSocketServerOptions,
  WSMessage,
} from './task-server-ws.types';

/**
 * WebSocket server for real-time task management
 */
export class TaskWebSocketServer implements ITaskServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private taskManager: ITaskManager;
  private taskProvider: ITaskProvider;
  private options: Required<WebSocketServerOptions>;
  private isRunning = false;

  constructor(config: TaskServerConfig) {
    this.taskManager = config.taskManager;
    this.taskProvider = config.taskProvider;
    this.options = {
      port: 3001,
      host: 'localhost',
      cors: true,
      maxClients: 100,
      heartbeatInterval: 30000,
      debug: false,
      ...config.options,
    };
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.options.port,
          host: this.options.host,
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error: Error) => {
          this.log('Server error:', error);
          reject(error);
        });

        this.wss.on('listening', () => {
          this.isRunning = true;
          this.log(
            `Server started on ws://${this.options.host}:${this.options.port}`,
          );
          this.startHeartbeat();
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      this.stopHeartbeat();

      // Close all client connections
      this.clients.forEach((client) => {
        client.ws.close();
      });
      this.clients.clear();

      // Close server
      if (this.wss) {
        this.wss.close(() => {
          this.isRunning = false;
          this.log('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WSMessage): void {
    const msg = JSON.stringify({
      ...message,
      timestamp: Date.now(),
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    });

    this.log('Broadcasting:', message.type);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);

    if (!client) {
      this.log(`Client ${clientId} not found`);
      return;
    }

    if (client.ws.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({
        ...message,
        timestamp: Date.now(),
      });
      client.ws.send(msg);
      this.log(`Sent to client ${clientId}:`, message.type);
    }
  }

  /**
   * Get all connected clients
   */
  getClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      running: this.isRunning,
      clients: this.clients.size,
      port: this.options.port,
      host: this.options.host,
    };
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: WebSocket): void {
    // Check max clients limit
    if (this.clients.size >= this.options.maxClients) {
      this.log('Max clients reached, rejecting connection');
      ws.close(1008, 'Server is full');
      return;
    }

    const clientId = randomUUID();
    const client: ClientConnection = {
      id: clientId,
      ws,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);
    this.log(`Client connected: ${clientId} (${this.clients.size} total)`);

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(clientId);
      this.log(`Client disconnected: ${clientId} (${this.clients.size} total)`);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      this.log(`Client error ${clientId}:`, error.message);
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      client.isAlive = true;
      client.lastActivity = Date.now();
    });

    // Send welcome message with initial task list
    this.sendInitialData(client);
  }

  /**
   * Send initial data to newly connected client
   */
  private async sendInitialData(client: ClientConnection): Promise<void> {
    try {
      const tasks = await this.taskProvider.getAllTasks();
      this.sendToClient(client.id, {
        type: 'tasks',
        payload: tasks,
      });
    } catch (error) {
      this.sendToClient(client.id, {
        type: 'error',
        payload: {
          message:
            error instanceof Error ? error.message : 'Failed to load tasks',
        },
      });
    }
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(
    client: ClientConnection,
    data: Buffer,
  ): Promise<void> {
    client.lastActivity = Date.now();

    try {
      const message: WSMessage = JSON.parse(data.toString());
      this.log(`Message from ${client.id}:`, message.type);

      switch (message.type) {
        case 'list':
          await this.handleListRequest(client, message);
          break;

        case 'find':
          await this.handleFindRequest(client, message);
          break;

        case 'update':
          await this.handleUpdateRequest(client, message);
          break;

        case 'start':
          await this.handleStartRequest(client, message);
          break;

        case 'finish':
          await this.handleFinishRequest(client, message);
          break;

        case 'pause':
          await this.handlePauseRequest(client, message);
          break;

        case 'ping':
          this.sendToClient(client.id, { type: 'pong' });
          break;

        default:
          this.sendToClient(client.id, {
            type: 'error',
            payload: { message: `Unknown message type: ${message.type}` },
          });
      }
    } catch (error) {
      this.log('Error handling message:', error);
      this.sendToClient(client.id, {
        type: 'error',
        payload: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to process message',
        },
      });
    }
  }

  /**
   * Handle list request
   */
  private async handleListRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const tasks = await this.taskProvider.getAllTasks();
    this.sendToClient(client.id, {
      type: 'tasks',
      payload: tasks,
      requestId: message.requestId,
    });
  }

  /**
   * Handle find request
   */
  private async handleFindRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const { taskId } = message.payload as { taskId: string };
    const task = await this.taskProvider.findTask(taskId);

    this.sendToClient(client.id, {
      type: 'task:found',
      payload: task,
      requestId: message.requestId,
    });
  }

  /**
   * Handle update request
   */
  private async handleUpdateRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const task = message.payload as TaskFile;
    await this.taskProvider.updateTask(task);

    // Broadcast update to all clients
    this.broadcast({
      type: 'task:updated',
      payload: task,
    });
  }

  /**
   * Handle start task request
   */
  private async handleStartRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const { taskId } = message.payload as { taskId: string };
    const task = await this.taskManager.startTask(taskId);

    // Broadcast update to all clients
    this.broadcast({
      type: 'task:updated',
      payload: task,
    });
  }

  /**
   * Handle finish task request
   */
  private async handleFinishRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const { taskId } = message.payload as { taskId: string };
    const task = await this.taskManager.finishTask(taskId);

    // Broadcast update to all clients
    this.broadcast({
      type: 'task:updated',
      payload: task,
    });
  }

  /**
   * Handle pause task request
   */
  private async handlePauseRequest(
    client: ClientConnection,
    message: WSMessage,
  ): Promise<void> {
    const { taskId } = message.payload as { taskId: string };
    // Note: Assuming TaskManager will have a pauseTask method
    // For now, we'll update the task status manually
    const task = await this.taskProvider.findTask(taskId);

    if (task) {
      task.status = 'pending';
      await this.taskProvider.updateTask(task);

      // Broadcast update to all clients
      this.broadcast({
        type: 'task:updated',
        payload: task,
      });
    }
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          this.log(`Client ${client.id} timeout, terminating`);
          client.ws.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[TaskWebSocketServer]', ...args);
    }
  }
}

/**
 * Create and start a WebSocket server for task management
 */
export async function createTaskWebSocketServer(
  taskManager: ITaskManager,
  taskProvider: ITaskProvider,
  options?: WebSocketServerOptions,
): Promise<TaskWebSocketServer> {
  const server = new TaskWebSocketServer({
    taskManager,
    taskProvider,
    options,
  });

  await server.start();
  return server;
}
