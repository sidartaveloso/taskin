import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ITaskManager } from '@opentask/taskin-task-manager';
import { filterTasks, summarizeTask, type TaskFilterCriteria } from '@opentask/taskin-task-manager';
import { type TaskId, TaskIdSchema } from '@opentask/taskin-types';
import type {
  ITaskMCPServer,
  MCPConnectionOptions,
  MCPPrompt,
  MCPPromptGetParams,
  MCPPromptGetResult,
  MCPResourceListResult,
  MCPResourceReadParams,
  MCPServerConfig,
  MCPTool,
  MCPToolCallParams,
  MCPToolCallResult,
} from './task-server-mcp.types.js';

/**
 * MCP Server for task management integration with LLMs
 */
/**
 * Tool arguments arrive as untyped JSON from the MCP client, so the id has to
 * be validated before it enters the domain — the branded `TaskId` is only
 * worth something if the boundary that mints it actually checks.
 */
function readTaskId(raw: unknown): TaskId | undefined {
  if (typeof raw !== 'string') return undefined;
  const parsed = TaskIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

function invalidTaskId(raw: unknown): MCPToolCallResult {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Invalid task id: ${JSON.stringify(raw)}. Expected the numeric id of a task, e.g. "020".`,
      },
    ],
    isError: true,
  };
}

export class TaskMCPServer implements ITaskMCPServer {
  private server: Server;
  private taskManager: ITaskManager;
  private config: Required<MCPServerConfig>;

  constructor(config: MCPServerConfig) {
    this.taskManager = config.taskManager;
    this.config = {
      name: 'taskin-mcp-server',
      version: '1.0.0',
      debug: false,
      ...config,
      taskManager: config.taskManager,
    };

    // Initialize MCP Server
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      },
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const { tools } = this.listTools();
      return { tools };
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const result = await this.callTool({
        name: request.params.name,
        arguments: request.params.arguments,
      });

      /*
       * `callTool` ja devolve blocos de conteudo, que e o que o SDK espera.
       *
       * Aqui havia `text: result.content` — embrulhar o arranjo dentro de um
       * bloco de texto, cujo `text` tem que ser string. O SDK recusava a
       * resposta inteira com `invalid_union`, entao `start_task` e
       * `finish_task` nunca funcionaram pelo transporte real. Nenhum teste
       * pegou porque todos chamam `callTool` direto e pulam este involucro.
       */
      return {
        content: result.content,
        isError: result.isError,
      };
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const { prompts } = this.listPrompts();
      return { prompts };
    });

    // Get a prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const result = await this.getPrompt({
        name: request.params.name,
        arguments: request.params.arguments as Record<string, string>,
      });

      // MCP SDK expects a messages array
      return {
        messages: result.messages.map((msg) => ({
          role: msg.role,
          content: {
            type: 'text' as const,
            text: msg.content,
          },
        })),
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const result = await this.listResources();
      return { resources: result.resources };
    });

    // Read a resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const result = await this.readResource({
        uri: request.params.uri,
      });

      return result;
    });
  }

  /**
   * Connect to MCP transport
   *
   * `MCPTransportType` tem um valor so, entao nao ha o que despachar. O ramo
   * que existia aqui aceitava `'sse'` pelo tipo e recusava em tempo de
   * execucao, ja com o provider inicializado.
   */
  async connect(_options: MCPConnectionOptions): Promise<void> {
    await this.server.connect(new StdioServerTransport());
    this.log('MCP Server connected via stdio');
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    };
  }

  /**
   * List available tools
   */
  listTools(): { tools: MCPTool[] } {
    const tools: MCPTool[] = [
      {
        name: 'list_tasks',
        description:
          'List the tasks in the project. Returns a JSON array with what identifies each task — id, title, status, type, assignee — without the markdown body. Fetch a task body by id after choosing one.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Exact status (pending, in-progress, done, ...)' },
            type: { type: 'string', description: 'Exact type (feat, fix, chore, ...)' },
            assignee: { type: 'string', description: 'Assignee id or name, whole or in part' },
            open: { type: 'boolean', description: 'Only tasks still open' },
            closed: { type: 'boolean', description: 'Only tasks already closed' },
            text: { type: 'string', description: 'Free text over id, title, status and assignee' },
          },
          required: [],
        },
      },
      {
        name: 'start_task',
        description: 'Start working on a task by changing its status to in-progress',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The unique identifier of the task (UUID)',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'finish_task',
        description: 'Mark a task as completed by changing its status to done',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The unique identifier of the task (UUID)',
            },
          },
          required: ['taskId'],
        },
      },
    ];

    return { tools };
  }

  /**
   * Call a tool
   */
  async callTool(params: MCPToolCallParams) {
    try {
      this.log(`Calling tool: ${params.name}`, params.arguments);

      switch (params.name) {
        case 'list_tasks':
          return await this.handleListTasks(params.arguments ?? {});

        case 'start_task': {
          const taskId = readTaskId(params.arguments?.taskId);
          return taskId ? await this.handleStartTask(taskId) : invalidTaskId(params.arguments?.taskId);
        }

        case 'finish_task': {
          const taskId = readTaskId(params.arguments?.taskId);
          return taskId ? await this.handleFinishTask(taskId) : invalidTaskId(params.arguments?.taskId);
        }

        default:
          return {
            content: [
              {
                type: 'text' as const,
                text: `Unknown tool: ${params.name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      this.log('Tool call error:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: error instanceof Error ? error.message : String(error),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle start_task tool
   */
  private async handleStartTask(taskId: TaskId): Promise<MCPToolCallResult> {
    const task = await this.taskManager.startTask(taskId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              message: `Task ${taskId} started successfully`,
              task: {
                id: task.id,
                title: task.title,
                status: task.status,
                type: task.type,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  /**
   * Handle finish_task tool
   */
  private async handleFinishTask(taskId: TaskId): Promise<MCPToolCallResult> {
    const task = await this.taskManager.finishTask(taskId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              message: `Task ${taskId} finished successfully`,
              task: {
                id: task.id,
                title: task.title,
                status: task.status,
                type: task.type,
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  /**
   * List available prompts
   */
  listPrompts(): { prompts: MCPPrompt[] } {
    const prompts: MCPPrompt[] = [
      {
        name: 'start-task-workflow',
        description: 'Guide the user through starting work on a task with git branch creation',
        arguments: [
          {
            name: 'taskId',
            description: 'The task ID to start',
            required: true,
          },
        ],
      },
      {
        name: 'finish-task-workflow',
        description: 'Guide the user through completing a task with commit and PR creation',
        arguments: [
          {
            name: 'taskId',
            description: 'The task ID to finish',
            required: true,
          },
        ],
      },
      {
        name: 'task-summary',
        description: 'Generate a summary of a task for documentation or reports',
        arguments: [
          {
            name: 'taskId',
            description: 'The task ID to summarize',
            required: true,
          },
        ],
      },
    ];

    return { prompts };
  }

  /**
   * Get a prompt
   */
  async getPrompt(params: MCPPromptGetParams): Promise<MCPPromptGetResult> {
    this.log(`Getting prompt: ${params.name}`, params.arguments);

    switch (params.name) {
      case 'start-task-workflow':
        return {
          description: 'Workflow for starting a task',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I want to start working on task ${params.arguments?.taskId}. Can you help me set everything up?`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `I'll help you start working on task ${params.arguments?.taskId}. Here's what I'll do:

1. Mark the task as "in-progress"
2. Create a git branch based on the task type and ID
3. Ensure your working directory is clean
4. Switch to the new branch

Let me start by marking the task as in-progress using the start_task tool.`,
              },
            },
          ],
        };

      case 'finish-task-workflow':
        return {
          description: 'Workflow for finishing a task',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I've completed task ${params.arguments?.taskId}. What should I do next?`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `Great! Let me help you finish task ${params.arguments?.taskId}. Here's the workflow:

1. Mark the task as "done"
2. Ensure all changes are committed
3. Push your branch to remote
4. Create a pull request

Let me start by marking the task as done using the finish_task tool.`,
              },
            },
          ],
        };

      case 'task-summary':
        return {
          description: 'Generate task summary',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Can you provide a summary of task ${params.arguments?.taskId}?`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `I'll generate a comprehensive summary of task ${params.arguments?.taskId} including its current status, description, and any relevant metadata.`,
              },
            },
          ],
        };

      default:
        throw new Error(`Unknown prompt: ${params.name}`);
    }
  }

  /**
   * Le e seleciona as tarefas, pela mesma seam que o CLI usa.
   *
   * `filterTasks` e `summarizeTask` vivem no pacote agnostico justamente para
   * que a resposta aqui e a de `taskin list --json` nao possam divergir — ja
   * houve duas filtragens discordando no repositorio.
   */
  private async selecionarTarefas(criteria: TaskFilterCriteria) {
    const tasks = await this.taskManager.getAllTasks();
    return filterTasks(tasks, criteria).map(summarizeTask);
  }

  /** Converte os argumentos crus da chamada MCP no criterio tipado. */
  private static criterioDe(args: Record<string, unknown>): TaskFilterCriteria {
    return {
      ...(typeof args.status === 'string' && { status: args.status as TaskFilterCriteria['status'] }),
      ...(typeof args.type === 'string' && { type: args.type as TaskFilterCriteria['type'] }),
      ...(typeof args.assignee === 'string' && { assignee: args.assignee }),
      ...(args.open === true && { open: true }),
      ...(args.closed === true && { closed: true }),
      ...(typeof args.text === 'string' && { text: args.text }),
    };
  }

  private async handleListTasks(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const tarefas = await this.selecionarTarefas(TaskMCPServer.criterioDe(args));

    return {
      content: [{ type: 'text', text: JSON.stringify(tarefas, null, 2) }],
      isError: false,
    };
  }

  /**
   * List available resources
   */
  async listResources(): Promise<MCPResourceListResult> {
    return {
      resources: [
        {
          uri: 'taskin://tasks',
          name: 'All Tasks',
          description: 'Access to all tasks in the system',
          mimeType: 'application/json',
        },
      ],
    };
  }

  /**
   * Read a resource
   */
  async readResource(params: MCPResourceReadParams) {
    this.log(`Reading resource: ${params.uri}`);

    // Parse URI (e.g., "taskin://tasks" or "taskin://task/123")
    const uri = params.uri;

    if (uri === 'taskin://tasks') {
      const tarefas = await this.selecionarTarefas({});
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(tarefas, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.error('[TaskMCPServer]', ...args);
    }
  }
}

/**
 * Create and connect a MCP server for task management
 */
export async function createTaskMCPServer(
  taskManager: ITaskManager,
  options?: Partial<MCPServerConfig>,
): Promise<TaskMCPServer> {
  const server = new TaskMCPServer({
    taskManager,
    ...options,
  });

  // Default to stdio transport
  await server.connect({ transport: 'stdio' });

  return server;
}
