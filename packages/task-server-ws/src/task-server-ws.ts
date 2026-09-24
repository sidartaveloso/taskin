import {
  GROUPS_NOT_SUPPORTED,
  type ITaskManager,
  type ITaskProvider,
  type NomeNaSuperficie,
} from '@opentask/taskin-task-manager';
import { type GroupId, GroupIdSchema, type Task, type TaskId, TaskIdSchema } from '@opentask/taskin-types';
import { randomUUID } from 'crypto';
import type { AddressInfo } from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  ClientConnection,
  ITaskServer,
  TaskServerConfig,
  WebSocketServerOptions,
  WSMessage,
} from './task-server-ws.types.js';

/** O que atende uma mensagem. Responde ao cliente, ou avisa todos. */
type Atendimento = (client: ClientConnection, message: WSMessage) => Promise<void>;

/**
 * WebSocket server for real-time task management
 */
export class TaskWebSocketServer<TTask extends Task = Task> implements ITaskServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private taskManager: ITaskManager<TTask>;
  private taskProvider: ITaskProvider<TTask>;
  private options: Required<WebSocketServerOptions>;
  private isRunning = false;

  /*
   * As mensagens sao atendidas uma de cada vez, na ordem em que chegaram — de
   * todos os clientes. O dashboard manda `create-group` e logo depois
   * `assign-to-group`; atendidas em paralelo, o segundo procurava o grupo
   * antes de o primeiro termina-lo.
   */
  private fila: Promise<void> = Promise.resolve();

  /*
   * Uma mensagem por operacao do `ITaskManager` que o WebSocket expoe, tipado
   * pelos nomes de `SUPERFICIES_DAS_OPERACOES`: declarar uma operacao ali para
   * o `ws` e esquecer o handler aqui nao compila. Ver
   * `docs/RDT/superficies-derivam-do-mesmo-contrato.md`.
   */
  private readonly operacoes: Record<NomeNaSuperficie<'ws'>, Atendimento> = {
    list: (client, message) => this.handleListRequest(client, message),
    start: (client, message) => this.comTarefa(client, message, (id) => this.taskManager.startTask(id)),
    pause: (client, message) => this.comTarefa(client, message, (id) => this.taskManager.pauseTask(id)),
    finish: (client, message) => this.comTarefa(client, message, (id) => this.taskManager.finishTask(id)),
    'assign-to-group': (client, message) =>
      this.comTarefa(client, message, async (id) => {
        const groupId = this.readGroupId(client, message);
        return groupId && this.taskManager.assignToGroup(id, groupId);
      }),
    'remove-from-group': (client, message) =>
      this.comTarefa(client, message, (id) => this.taskManager.removeFromGroup(id)),
    'set-priority': (client, message) =>
      this.comTarefa(client, message, async (id) => {
        const priority = this.readNumber(client, message, 'priority');
        return priority === undefined ? undefined : this.taskManager.setPriority(id, priority);
      }),
    'set-difficulty': (client, message) =>
      this.comTarefa(client, message, async (id) => {
        const difficulty = this.readNumber(client, message, 'difficulty');
        return difficulty === undefined ? undefined : this.taskManager.setDifficulty(id, difficulty);
      }),
    'move-before': (client, message) => this.mover(client, message, 'before'),
    'move-after': (client, message) => this.mover(client, message, 'after'),
    'move-to-top': (client, message) => this.levarAoExtremo(client, message, 'top'),
    'move-to-bottom': (client, message) => this.levarAoExtremo(client, message, 'bottom'),
  };

  /** O que o protocolo atende e nao e operacao do `ITaskManager`. */
  private readonly consultas: Record<'find' | 'create-group' | 'ping', Atendimento> = {
    find: (client, message) => this.handleFindRequest(client, message),
    'create-group': (client, message) => this.handleCreateGroup(client, message),
    ping: async (client) => this.sendToClient(client.id, { type: 'pong' }),
  };

  constructor(config: TaskServerConfig<TTask>) {
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
          this.log(`Server started on ws://${this.options.host}:${this.options.port}`);
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
    // Com `port: 0` o sistema escolhe a porta; a que vale e a que foi aberta.
    const address = this.wss?.address() as AddressInfo | null | undefined;

    return {
      running: this.isRunning,
      clients: this.clients.size,
      port: address?.port ?? this.options.port,
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
      this.fila = this.fila.then(() => this.handleMessage(client, data));
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
          message: error instanceof Error ? error.message : 'Failed to load tasks',
        },
      });
    }
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(client: ClientConnection, data: Buffer): Promise<void> {
    client.lastActivity = Date.now();

    try {
      const message: WSMessage = JSON.parse(data.toString());
      this.log(`Message from ${client.id}:`, message.type);

      const atender =
        this.operacoes[message.type as keyof typeof this.operacoes] ??
        this.consultas[message.type as keyof typeof this.consultas];

      if (!atender) {
        this.sendToClient(client.id, {
          type: 'error',
          payload: { message: `Unknown message type: ${message.type}` },
          requestId: message.requestId,
        });
        return;
      }

      await atender(client, message);
    } catch (error) {
      this.log('Error handling message:', error);
      this.sendToClient(client.id, {
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Failed to process message',
        },
      });
    }
  }

  /**
   * Reads the task id out of an incoming message.
   *
   * Ids on the wire are untrusted strings: a branded `TaskId` is only worth
   * something if the boundary that produces it actually validates. Answers the
   * client with a clear error instead of letting a ZodError leak out of the
   * generic catch.
   */
  private readTaskId(client: ClientConnection, message: WSMessage, field = 'taskId'): TaskId | undefined {
    const raw = this.campo(message, field);
    const parsed = typeof raw === 'string' ? TaskIdSchema.safeParse(raw) : undefined;

    if (!parsed?.success) {
      this.recusar(client, message, `Invalid task id in '${message.type}' request`);
      return undefined;
    }

    return parsed.data;
  }

  /** Como {@link readTaskId}, para o id de um grupo. */
  private readGroupId(client: ClientConnection, message: WSMessage, field = 'groupId'): GroupId | undefined {
    const raw = this.campo(message, field);
    const parsed = typeof raw === 'string' ? GroupIdSchema.safeParse(raw) : undefined;

    if (!parsed?.success) {
      this.recusar(client, message, `Invalid group id in '${message.type}' request`);
      return undefined;
    }

    return parsed.data;
  }

  /**
   * Um numero do payload. So confere que e numero: a faixa e regra da
   * operacao, e o `ITaskManager` recusa com a propria frase.
   */
  private readNumber(client: ClientConnection, message: WSMessage, field: string): number | undefined {
    const raw = this.campo(message, field);

    if (typeof raw !== 'number') {
      this.recusar(client, message, `Missing or invalid '${field}' in '${message.type}' request`);
      return undefined;
    }

    return raw;
  }

  private campo(message: WSMessage, field: string): unknown {
    return (message.payload as Record<string, unknown> | undefined)?.[field];
  }

  private recusar(client: ClientConnection, message: WSMessage, texto: string): void {
    this.sendToClient(client.id, {
      type: 'error',
      payload: { message: texto },
      requestId: message.requestId,
    });
  }

  /**
   * Le o `taskId`, roda a operacao e avisa todos os clientes da tarefa como
   * ficou. A operacao devolve `undefined` quando ja recusou o payload.
   */
  private async comTarefa(
    client: ClientConnection,
    message: WSMessage,
    operacao: (taskId: TaskId) => Promise<TTask | undefined>,
  ): Promise<void> {
    const taskId = this.readTaskId(client, message);
    if (!taskId) return;

    const task = await operacao(taskId);
    if (!task) return;

    this.broadcast({ type: 'task:updated', payload: task });
  }

  /**
   * Mover pode renumerar a vizinhanca quando nao ha espaco entre os numeros, e
   * a operacao so devolve a tarefa movida — entao todos recebem a lista inteira.
   */
  private async mover(client: ClientConnection, message: WSMessage, lado: 'before' | 'after'): Promise<void> {
    const taskId = this.readTaskId(client, message);
    if (!taskId) return;
    const targetId = this.readTaskId(client, message, 'targetId');
    if (!targetId) return;

    await (lado === 'before'
      ? this.taskManager.moveBefore(taskId, targetId)
      : this.taskManager.moveAfter(taskId, targetId));

    this.broadcast({ type: 'tasks', payload: await this.taskManager.getAllTasks() });
  }

  /**
   * Topo e fim, como {@link TaskWebSocketServer.mover}: ir ao fim de uma cauda
   * sem numero numera a cauda, entao todos recebem a lista inteira.
   */
  private async levarAoExtremo(client: ClientConnection, message: WSMessage, extremo: 'top' | 'bottom'): Promise<void> {
    const taskId = this.readTaskId(client, message);
    if (!taskId) return;

    await (extremo === 'top' ? this.taskManager.moveToTop(taskId) : this.taskManager.moveToBottom(taskId));

    this.broadcast({ type: 'tasks', payload: await this.taskManager.getAllTasks() });
  }

  /**
   * Cria um grupo no registro. O dashboard gera o id ao agrupar duas tarefas
   * no quadro, e precisa que o grupo exista antes de `assign-to-group` — que
   * recusa grupo inexistente, como na CLI e no MCP.
   */
  private async handleCreateGroup(client: ClientConnection, message: WSMessage): Promise<void> {
    const registry = this.taskManager.groupRegistry;
    if (!registry) {
      this.recusar(client, message, GROUPS_NOT_SUPPORTED);
      return;
    }

    const id = this.readGroupId(client, message, 'id');
    if (!id) return;
    const name = this.campo(message, 'name');
    if (typeof name !== 'string' || name.trim() === '') {
      this.recusar(client, message, `Missing or invalid 'name' in '${message.type}' request`);
      return;
    }

    await registry.createGroup({ id, name });
    this.broadcast({ type: 'group:created', payload: { id, name } });
  }

  /**
   * Handle list request
   */
  private async handleListRequest(client: ClientConnection, message: WSMessage): Promise<void> {
    const tasks = await this.taskManager.getAllTasks();

    const [first] = tasks;
    if (first) {
      this.log('[WS Server] Sending', tasks.length, 'tasks');
      this.log('[WS Server] First task assignee:', first.assignee);
    }

    this.sendToClient(client.id, {
      type: 'tasks',
      payload: tasks,
      requestId: message.requestId,
    });
  }

  /**
   * Handle find request
   */
  private async handleFindRequest(client: ClientConnection, message: WSMessage): Promise<void> {
    const taskId = this.readTaskId(client, message);
    if (!taskId) return;

    const task = await this.taskProvider.findTask(taskId);

    this.sendToClient(client.id, {
      type: 'task:found',
      payload: task,
      requestId: message.requestId,
    });
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
export async function createTaskWebSocketServer<TTask extends Task = Task>(
  taskManager: ITaskManager<TTask>,
  taskProvider: ITaskProvider<TTask>,
  options?: WebSocketServerOptions,
): Promise<TaskWebSocketServer<TTask>> {
  const server = new TaskWebSocketServer<TTask>({
    taskManager,
    taskProvider,
    options,
  });

  await server.start();
  return server;
}
