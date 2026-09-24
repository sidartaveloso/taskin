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
import {
  DIFICULDADE_MAXIMA,
  DIFICULDADE_MINIMA,
  filterCriteriaJsonSchema,
  filterTasks,
  GROUPS_NOT_SUPPORTED,
  type ITaskManager,
  type ModoDeOrdenacao,
  numerarPrioridade,
  ordenarTarefas,
  parseFilterCriteria,
  summarizeTask,
  type TaskFilterCriteria,
} from '@opentask/taskin-task-manager';
import {
  type GroupId,
  GroupIdSchema,
  type Task,
  type TaskId,
  TaskIdSchema,
  type TaskStatus,
} from '@opentask/taskin-types';
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
  TaskStatusChangeHook,
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

function readGroupId(raw: unknown): GroupId | undefined {
  const parsed = GroupIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** Uma recusa em uma frase, no formato que o cliente MCP mostra. */
function recusa(text: string): MCPToolCallResult {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

/** Resposta de sucesso com o grupo como ficou gravado — o pai incluso. */
function grupoAlterado(group: { id: GroupId; name: string; parentId?: GroupId }): MCPToolCallResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, group }, null, 2) }] };
}

/** Resposta de sucesso com a tarefa como o `start_task` ja a descreve. */
function tarefaAlterada(
  task: {
    id: TaskId;
    title: string;
    status: TaskStatus;
    type: string;
    groupId?: GroupId;
    order?: number;
    difficulty?: number;
  },
  extra: Record<string, unknown> = {},
): MCPToolCallResult {
  const { id, title, status, type, groupId, order, difficulty } = task;
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          { success: true, task: { id, title, status, type, groupId, priority: order, difficulty }, ...extra },
          null,
          2,
        ),
      },
    ],
    isError: false,
  };
}

const TASK_ID_PROPERTY = { type: 'string', description: 'The id of the task, e.g. "020"' } as const;

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
  private config: Required<Omit<MCPServerConfig, 'onStatusChange'>>;
  /**
   * Injected side effect for status-changing tools. Undefined when the host
   * wires no automation (e.g. a plain programmatic embed), in which case
   * `start_task`/`finish_task` change status and nothing else — the pre-hook
   * behavior.
   */
  private onStatusChange?: TaskStatusChangeHook;

  constructor(config: MCPServerConfig) {
    this.taskManager = config.taskManager;
    this.onStatusChange = config.onStatusChange;
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
        name: 'list_groups',
        description:
          'List the task groups in this project, each with its id, name and — when nested inside another group — its `parentId`. The name lives in one place — a task only carries the group id — so renaming a group touches no task file.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'prioritize_tasks',
        description:
          'Give every task in the project a priority number, once and on purpose. Tasks that already carry one keep it; the gaps around them are filled. Running it again changes nothing. Use it on a project where only some tasks are prioritised — there, moving a task rewrites every file before it, and this ends that state.',
        inputSchema: {
          type: 'object',
          properties: {
            dryRun: { type: 'boolean', description: 'Report how many would be numbered, without writing' },
          },
        },
      },
      /*
       * Agrupar so e anunciado quando a fonte tem grupos (task-079): um
       * provider sem o conceito nao oferece a operacao, em vez de oferecer uma
       * que sempre falha.
       */
      ...(this.taskManager.groupRegistry ? this.ferramentasDeGrupo() : []),
      {
        name: 'set_priority',
        description:
          'Give one task a place in the queue. Pass exactly one of: `priority` (an absolute number, lower comes first), `before` (the id of the task it should come right before), `after`, `top: true` or `bottom: true`. A grouped task goes to the top or bottom of its own group. Relative moves write only what changes — usually one file — and the result says how many (`changed`).',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: TASK_ID_PROPERTY,
            priority: { type: 'integer', minimum: 1, description: 'Absolute priority number; lower comes first' },
            before: { type: 'string', description: 'Place the task right before this task id' },
            after: { type: 'string', description: 'Place the task right after this task id' },
            top: {
              type: 'boolean',
              description: 'Move the task to the top of the queue — of its own group, when grouped',
            },
            bottom: {
              type: 'boolean',
              description:
                'Move the task to the bottom of the queue — of its own group, when grouped. An unnumbered tail is numbered once; `changed` says how many files',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'set_difficulty',
        description: `Score how hard one task is, from ${DIFICULDADE_MINIMA} (trivial) to ${DIFICULDADE_MAXIMA} (very hard). Use it on what \`list_tasks\` with \`unscored: true\` returns. A score is corrected by scoring again; there is no way to clear it.`,
        inputSchema: {
          type: 'object',
          properties: {
            taskId: TASK_ID_PROPERTY,
            difficulty: {
              type: 'integer',
              minimum: DIFICULDADE_MINIMA,
              maximum: DIFICULDADE_MAXIMA,
              description: 'Perceived difficulty, a whole number',
            },
          },
          required: ['taskId', 'difficulty'],
        },
      },
      {
        name: 'list_tasks',
        description:
          'List the tasks in the project. Returns a JSON array with what identifies each task — id, title, status, type, assignee — without the markdown body. Fetch a task body by id after choosing one.',
        /*
         * O schema JSON dos criterios sai do schema unico em `task-manager`, o
         * mesmo que valida a chamada e gera as flags da CLI — nao de uma lista
         * escrita a mao aqui.
         */
        inputSchema: {
          ...filterCriteriaJsonSchema(),
          properties: {
            ...filterCriteriaJsonSchema().properties,
            /*
             * `sort` nao vem do schema de criterios de proposito: ordenar nao
             * restringe nada. Fica ao lado, com o mesmo vocabulario do quadro
             * de priorizacao do dashboard.
             */
            sort: {
              type: 'string',
              description: 'Order: manual (priority), diff-asc or diff-desc. Defaults to manual.',
            },
          },
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

  private ferramentasDeGrupo(): MCPTool[] {
    return [
      {
        name: 'join_group',
        description:
          'Put a task in an existing group. The group must already exist — see list_groups. A task belongs to at most one group, so this moves it out of any other.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: TASK_ID_PROPERTY,
            groupId: { type: 'string', description: 'The id of the group, as list_groups returns it' },
          },
          required: ['taskId', 'groupId'],
        },
      },
      {
        name: 'leave_group',
        description: 'Take a task out of its group. A task without a group is left as it is.',
        inputSchema: { type: 'object', properties: { taskId: TASK_ID_PROPERTY }, required: ['taskId'] },
      },
      {
        name: 'create_group',
        description:
          'Create a task group, at the root or already inside another group (`parentId`). Returns the group with its id — pass `id` to choose one. Groups nest at most four levels deep.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The name of the group' },
            id: { type: 'string', description: 'The id for the group; generated (g-...) when absent' },
            parentId: { type: 'string', description: 'The group to create it inside, as list_groups returns it' },
          },
          required: ['name'],
        },
      },
      ...(this.taskManager.groupRegistry?.setParent ? this.ferramentasDeAninhamento() : []),
      {
        name: 'move_group',
        description:
          'Move a whole group in the queue, its members together and in their current order. Pass `groupId` and exactly one of: `before` or `after` (a task that is not in a group, or another group id), `top: true` or `bottom: true`. Only the members are written — a group of three writes three files — and the result says how many (`changed`).',
        inputSchema: {
          type: 'object',
          properties: {
            groupId: { type: 'string', description: 'The id of the group to move, as list_groups returns it' },
            before: { type: 'string', description: 'Place the group right before this task id or group id' },
            after: { type: 'string', description: 'Place the group right after this task id or group id' },
            top: { type: 'boolean', description: 'Move the group to the top of the queue' },
            bottom: { type: 'boolean', description: 'Move the group to the bottom of the queue' },
          },
          required: ['groupId'],
        },
      },
    ];
  }

  /**
   * Grupo dentro de grupo (task-119), so anunciado quando o registro o tem —
   * um provider pode ter grupos e nao ter aninhamento.
   */
  private ferramentasDeAninhamento(): MCPTool[] {
    return [
      {
        name: 'nest_group',
        description:
          'Put a group inside another group. Its tasks stay where they are: a task keeps its innermost group, and being in the parent now includes being in a subgroup of it. Refuses a missing parent, the group itself, a group inside it (a cycle), and nesting beyond four levels.',
        inputSchema: {
          type: 'object',
          properties: {
            groupId: { type: 'string', description: 'The group to nest, as list_groups returns it' },
            parentId: { type: 'string', description: 'The group to put it inside' },
          },
          required: ['groupId', 'parentId'],
        },
      },
      {
        name: 'unnest_group',
        description: 'Take a group out of its parent, back to the root. A group without a parent is left as it is.',
        inputSchema: {
          type: 'object',
          properties: { groupId: { type: 'string', description: 'The group, as list_groups returns it' } },
          required: ['groupId'],
        },
      },
    ];
  }

  /**
   * Call a tool
   */
  async callTool(params: MCPToolCallParams) {
    try {
      this.log(`Calling tool: ${params.name}`, params.arguments);

      switch (params.name) {
        case 'list_groups':
          return await this.handleListGroups();

        case 'prioritize_tasks':
          return await this.handlePrioritizeTasks(params.arguments ?? {});

        case 'list_tasks':
          return await this.handleListTasks(params.arguments ?? {});

        case 'join_group':
          return await this.handleJoinGroup(params.arguments ?? {});

        case 'leave_group':
          return await this.handleLeaveGroup(params.arguments ?? {});

        case 'move_group':
          return await this.handleMoveGroup(params.arguments ?? {});

        case 'create_group':
          return await this.handleCreateGroup(params.arguments ?? {});

        case 'nest_group':
          return await this.handleNestGroup(params.arguments ?? {});

        case 'unnest_group':
          return await this.handleUnnestGroup(params.arguments ?? {});

        case 'set_priority':
          return await this.handleSetPriority(params.arguments ?? {});

        case 'set_difficulty':
          return await this.handleSetDifficulty(params.arguments ?? {});

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
    await this.notifyStatusChange(task.id, task.status);

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
    /*
     * O relato dos criterios em aberto viaja junto: um agente que fecha uma
     * tarefa precisa ver o que ficou para tras tanto quanto uma pessoa — foi
     * justamente um agente que fechou quatro tarefas com o checklist inteiro em
     * aberto.
     */
    const { task, blockers } = await this.taskManager.finishTaskComRelato(taskId);
    await this.notifyStatusChange(task.id, task.status);

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
              /*
               * O que ficou em aberto viaja na resposta, e nao so no texto: um
               * agente precisa poder **reagir** a isso, e nao apenas ler.
               */
              openCriteria: blockers,
              ...(blockers.length > 0 && {
                hint: 'Tick these in the task file, or say why they were dropped: "— adiado: <reason>".',
              }),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  /**
   * Run the injected status-change hook, if any.
   *
   * Best-effort on purpose: the task's status was already persisted by the
   * manager, so a hook that throws (a git problem, say) must not turn a
   * successful `start_task`/`finish_task` into a failed tool call. The failure
   * is logged and the tool still reports success — same posture the CLI takes,
   * where a failed auto-commit only drops the "Auto-committed" line.
   */
  private async notifyStatusChange(taskId: TaskId, status: TaskStatus): Promise<void> {
    if (!this.onStatusChange) return;

    try {
      await this.onStatusChange({ taskId, status });
    } catch (error) {
      this.log('onStatusChange hook failed:', error);
    }
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
  private async selecionarTarefas(criteria: TaskFilterCriteria, modo: ModoDeOrdenacao = 'manual') {
    const tasks = await this.taskManager.getAllTasks();
    /*
     * Ordenar antes de resumir: o resumo expoe `priority`, e a ordenacao
     * trabalha com `order` — a traducao acontece depois, e nao no meio.
     */
    return ordenarTarefas(filterTasks(tasks, criteria), modo).map(summarizeTask);
  }

  /**
   * Numeracao inicial de prioridade.
   *
   * Delega a mesma funcao que a CLI usa (`numerarPrioridade`), para as duas
   * superficies nao divergirem na regra.
   */
  /**
   * Os grupos, quando o provider tem o conceito.
   *
   * Um provider sem grupos nao expoe o registro, e a ferramenta diz isso em vez
   * de falhar — a ausencia e informacao, e nao erro.
   */
  private async handleListGroups(): Promise<MCPToolCallResult> {
    const registro = this.taskManager.groupRegistry;

    if (!registro) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ supported: false, groups: [] }, null, 2) }],
        isError: false,
      };
    }

    const grupos = await registro.listGroups();
    return {
      content: [{ type: 'text', text: JSON.stringify({ supported: true, groups: grupos }, null, 2) }],
      isError: false,
    };
  }

  private async handlePrioritizeTasks(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const resultado = await this.taskManager.prioritizeAll({ dryRun: args.dryRun === true });

    return {
      content: [{ type: 'text', text: JSON.stringify(resultado, null, 2) }],
      isError: false,
    };
  }

  private async handleJoinGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.taskManager.groupRegistry) return recusa(GROUPS_NOT_SUPPORTED);

    const taskId = readTaskId(args.taskId);
    if (!taskId) return invalidTaskId(args.taskId);
    const groupId = readGroupId(args.groupId);
    if (!groupId) return recusa(`Invalid group id: ${JSON.stringify(args.groupId)}. See list_groups.`);

    return tarefaAlterada(await this.taskManager.assignToGroup(taskId, groupId));
  }

  private async handleCreateGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.taskManager.groupRegistry) return recusa(GROUPS_NOT_SUPPORTED);

    if (typeof args.name !== 'string' || args.name.trim() === '') {
      return recusa(`A group needs a name; got ${JSON.stringify(args.name)}.`);
    }
    const id = args.id === undefined ? undefined : readGroupId(args.id);
    if (args.id !== undefined && !id) return recusa(`Invalid group id: ${JSON.stringify(args.id)}.`);
    const parentId = args.parentId === undefined ? undefined : readGroupId(args.parentId);
    if (args.parentId !== undefined && !parentId) {
      return recusa(`Invalid group id: ${JSON.stringify(args.parentId)}. See list_groups.`);
    }

    return grupoAlterado(
      await this.taskManager.createGroup(args.name, { ...(id && { id }), ...(parentId && { parentId }) }),
    );
  }

  private async handleNestGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const groupId = readGroupId(args.groupId);
    if (!groupId) return recusa(`Invalid group id: ${JSON.stringify(args.groupId)}. See list_groups.`);
    const parentId = readGroupId(args.parentId);
    if (!parentId) return recusa(`Invalid group id: ${JSON.stringify(args.parentId)}. See list_groups.`);

    return grupoAlterado(await this.taskManager.nestGroup(groupId, parentId));
  }

  private async handleUnnestGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const groupId = readGroupId(args.groupId);
    if (!groupId) return recusa(`Invalid group id: ${JSON.stringify(args.groupId)}. See list_groups.`);

    return grupoAlterado(await this.taskManager.unnestGroup(groupId));
  }

  private async handleLeaveGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.taskManager.groupRegistry) return recusa(GROUPS_NOT_SUPPORTED);

    const taskId = readTaskId(args.taskId);
    if (!taskId) return invalidTaskId(args.taskId);

    return tarefaAlterada(await this.taskManager.removeFromGroup(taskId));
  }

  /**
   * Uma ferramenta so para as tres formas, como o `taskin priority` da CLI.
   * Mais de uma forma na mesma chamada e ambiguo, e se recusa em vez de
   * escolher uma em silencio.
   */
  private async handleSetPriority(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const taskId = readTaskId(args.taskId);
    if (!taskId) return invalidTaskId(args.taskId);

    for (const extremo of ['top', 'bottom'] as const) {
      if (args[extremo] !== undefined && typeof args[extremo] !== 'boolean') {
        return recusa(`\`${extremo}\` must be true; got ${JSON.stringify(args[extremo])}.`);
      }
    }

    // `top: false` e o mesmo que nao pedir: nao conta como forma.
    const formas = (['priority', 'before', 'after', 'top', 'bottom'] as const).filter(
      (k) => args[k] !== undefined && args[k] !== false,
    );
    if (formas.length !== 1) {
      return recusa('Pass exactly one of `priority`, `before`, `after`, `top` or `bottom`.');
    }

    if (args.top === true || args.bottom === true) {
      const { task, changed } =
        args.top === true ? await this.taskManager.moveToTop(taskId) : await this.taskManager.moveToBottom(taskId);
      return tarefaAlterada(task, { changed });
    }

    if (args.priority !== undefined) {
      if (typeof args.priority !== 'number')
        return recusa(`Priority must be a number; got ${JSON.stringify(args.priority)}.`);
      return tarefaAlterada(await this.taskManager.setPriority(taskId, args.priority), { changed: 1 });
    }

    const referencia = args.before ?? args.after;
    const targetId = readTaskId(referencia);
    if (!targetId) return invalidTaskId(referencia);

    const { task, changed } =
      args.before !== undefined
        ? await this.taskManager.moveBefore(taskId, targetId)
        : await this.taskManager.moveAfter(taskId, targetId);

    return tarefaAlterada(task, { changed });
  }

  /**
   * Um grupo inteiro se move (task-117), nas mesmas quatro formas do
   * `set_priority` sem o numero absoluto — um numero so nao diz onde ficam
   * varios membros. O alvo pode ser tarefa ou grupo: quem decide e o manager.
   */
  private async handleMoveGroup(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.taskManager.groupRegistry) return recusa(GROUPS_NOT_SUPPORTED);

    const groupId = readGroupId(args.groupId);
    if (!groupId) return recusa(`Invalid group id: ${JSON.stringify(args.groupId)}. See list_groups.`);

    for (const extremo of ['top', 'bottom'] as const) {
      if (args[extremo] !== undefined && typeof args[extremo] !== 'boolean') {
        return recusa(`\`${extremo}\` must be true; got ${JSON.stringify(args[extremo])}.`);
      }
    }

    const formas = (['before', 'after', 'top', 'bottom'] as const).filter(
      (k) => args[k] !== undefined && args[k] !== false,
    );
    if (formas.length !== 1) return recusa('Pass exactly one of `before`, `after`, `top` or `bottom`.');

    let resultado: { members: Task[]; changed: number };
    if (args.top === true) resultado = await this.taskManager.moveGroupToTop(groupId);
    else if (args.bottom === true) resultado = await this.taskManager.moveGroupToBottom(groupId);
    else {
      const referencia = args.before ?? args.after;
      const alvo = readGroupId(referencia);
      if (!alvo) return recusa(`Invalid target: ${JSON.stringify(referencia)}. Use a task id or a group id.`);
      resultado =
        args.before !== undefined
          ? await this.taskManager.moveGroupBefore(groupId, alvo)
          : await this.taskManager.moveGroupAfter(groupId, alvo);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { success: true, groupId, members: resultado.members.map(summarizeTask), changed: resultado.changed },
            null,
            2,
          ),
        },
      ],
      isError: false,
    };
  }

  private async handleSetDifficulty(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const taskId = readTaskId(args.taskId);
    if (!taskId) return invalidTaskId(args.taskId);

    // Um texto como "3" nao vira numero calado: o schema anuncia inteiro.
    if (typeof args.difficulty !== 'number') {
      return recusa(
        `Invalid difficulty: ${JSON.stringify(args.difficulty)}. Use a whole number from ${DIFICULDADE_MINIMA} to ${DIFICULDADE_MAXIMA}.`,
      );
    }
    return tarefaAlterada(await this.taskManager.setDifficulty(taskId, args.difficulty));
  }

  private async handleListTasks(args: Record<string, unknown>): Promise<MCPToolCallResult> {
    const modo = args.sort === 'diff-asc' || args.sort === 'diff-desc' ? args.sort : 'manual';
    const tarefas = await this.selecionarTarefas(parseFilterCriteria(args), modo);

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
      const tarefas = await this.selecionarTarefas({ all: true });
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
