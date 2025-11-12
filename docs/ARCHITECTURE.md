# Arquitetura Taskin

## Visão Geral

O Taskin é uma plataforma modular de gerenciamento de tarefas com suporte a múltiplos providers e integração com LLMs através do Model Context Protocol (MCP).

## Stack Técnico

- **Frontend**: Vue 3 + Vite + TypeScript + Pinia
- **Backend**: Node.js + WebSocket (ws) + Model Context Protocol SDK
- **CLI**: Commander.js + tsup
- **Monorepo**: pnpm workspaces
- **Design System**: CSS Variables + Atomic Design

## Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Dashboard (Vue 3)          CLI Commands                    │
│  ├─ TaskGrid                ├─ taskin dashboard            │
│  ├─ TaskCard                ├─ taskin mcp-server           │
│  └─ ProgressBar             ├─ taskin start/finish/pause   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                    │
├─────────────────────────────────────────────────────────────┤
│  PiniaTaskProvider                                          │
│  ├─ State: tasks, loading, connected, error                │
│  ├─ Getters: taskById, tasksByStatus, connectionStatus     │
│  ├─ Actions: connect, disconnect, send, handleMessage      │
│  └─ WebSocket: auto-reconnect, heartbeat, offline cache    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Communication Layer                       │
├─────────────────────────────────────────────────────────────┤
│  TaskWebSocketServer        TaskMCPServer                   │
│  ├─ Port: 3001              ├─ Transport: stdio/sse        │
│  ├─ Multi-client            ├─ Tools: start_task/finish    │
│  ├─ Broadcast updates       ├─ Prompts: workflows          │
│  ├─ Heartbeat: 30s          └─ Resources: taskin://tasks   │
│  └─ Message routing                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  TaskManager                                                │
│  ├─ ITaskManager (write): updateTask, pauseTask, etc.      │
│  ├─ ITaskProvider (read): findTask, getAllTasks            │
│  └─ Validation: state transitions, required fields         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│  FileSystemTaskProvider                                     │
│  ├─ tasksDir: TASKS/ (default)                             │
│  ├─ Format: task-{id}-{slug}.md                            │
│  ├─ YAML frontmatter + Markdown content                    │
│  └─ Git integration (optional)                             │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. WebSocket Flow (Dashboard ↔ TaskManager)

```
User Action (Dashboard)
    ↓
Vue Component (TaskCard.vue)
    ↓
usePiniaTaskProvider().send({ type: 'update', task })
    ↓
WebSocket Client (ws://localhost:3001)
    ↓
TaskWebSocketServer.handleMessage()
    ↓
TaskManager.updateTask()
    ↓
FileSystemTaskProvider.updateTask()
    ↓
Broadcast to all clients
    ↓
PiniaTaskProvider.handleMessage()
    ↓
Vue Reactivity (Pinia state update)
    ↓
UI Update (TaskCard.vue re-renders)
```

### 2. MCP Flow (LLM ↔ TaskManager)

```
LLM Request (Claude/GPT-4)
    ↓
MCP Client (stdio)
    ↓
TaskMCPServer.handleToolCall('start_task')
    ↓
TaskManager.updateTask({ status: 'in-progress' })
    ↓
FileSystemTaskProvider.updateTask()
    ↓
MCP Response (task updated)
    ↓
LLM continues conversation
```

## Packages

### Core Packages

#### @opentask/taskin-task-manager

- **Interface**: `ITaskManager` (write), `ITaskProvider` (read)
- **Responsabilidade**: Validação de transições de estado, lógica de negócio
- **Principais métodos**: `updateTask()`, `pauseTask()`, `startTask()`, `finishTask()`

#### @opentask/taskin-fs-provider

- **Interface**: Implementa `ITaskProvider`
- **Responsabilidade**: Persistência de tarefas em arquivos Markdown
- **Formato**: `task-{id}-{slug}.md` com YAML frontmatter

#### @opentask/taskin-types-ts

- **Conteúdo**: Schemas Zod, tipos TypeScript gerados
- **Principais tipos**: `Task`, `TaskStatus`, `TaskPriority`

### Server Packages

#### @opentask/taskin-task-server-ws

- **Classe**: `TaskWebSocketServer`
- **Funcionalidade**: Servidor WebSocket multi-client com broadcast
- **Configuração**:
  ```typescript
  {
    taskManager: ITaskManager,
    taskProvider: ITaskProvider,
    options: {
      port: 3001,
      host: 'localhost',
      heartbeatInterval: 30000
    }
  }
  ```
- **Mensagens**: `list`, `find`, `update`, `task:updated`, `error`

#### @opentask/taskin-task-server-mcp

- **Classe**: `TaskMCPServer`
- **Funcionalidade**: Servidor MCP para integração com LLMs
- **Tools**:
  - `start_task`: Inicia uma tarefa (muda status para in-progress)
  - `finish_task`: Finaliza uma tarefa (muda status para done)
- **Prompts**:
  - `start-task-workflow`: Template para workflow de início
  - `finish-task-workflow`: Template para workflow de conclusão
  - `task-summary`: Template para resumo de tarefas
- **Resources**:
  - `taskin://tasks`: Lista todas as tarefas

### Frontend Packages

#### @opentask/taskin-task-provider-pinia

- **Store**: `usePiniaTaskProvider(config)`
- **Funcionalidade**: Pinia store com sincronização WebSocket
- **State**:
  ```typescript
  {
    tasks: Map<string, Task>,
    loading: boolean,
    connected: boolean,
    error: string | null,
    reconnectAttempts: number,
    lastSync: number | null
  }
  ```
- **Features**:
  - Auto-reconnect (delay configurável, padrão 5s)
  - Heartbeat ping/pong (10s/30s timeout)
  - Offline-first cache (tasks persistidos no Map)
  - Getters reativos: `taskById`, `tasksByStatus`, `connectionStatus`

#### @opentask/taskin-dashboard

- **Componentes**:
  - `TaskGrid`: Grade responsiva com tasks
  - `TaskCard`: Card de task com status, badges, progress
  - `ProgressBar`: Barra de progresso animada
- **Design System**:
  - 50+ CSS variables (cores, sombras, espaçamento, tipografia)
  - Atomic Design (atoms/molecules/organisms/templates)
  - Google Fonts: Ubuntu (headings) + Roboto (body)
- **Integração**: App.vue conecta com WebSocket via PiniaTaskProvider

### CLI Package

#### @opentask/taskin-cli

- **Comandos**:
  - `taskin dashboard`: Inicia WebSocket server + Vite dev server
    - `--port <number>`: Porta do Vite (padrão: 5173)
    - `--ws-port <number>`: Porta do WebSocket (padrão: 3001)
    - `--host <string>`: Host do servidor (padrão: localhost)
    - `--open`: Abre navegador automaticamente
  - `taskin mcp-server`: Inicia MCP server
    - `--transport <stdio|sse>`: Tipo de transporte (padrão: stdio)
    - `--debug`: Ativa logs de debug
  - `taskin start/finish/pause <task-id>`: Comandos de task management
- **Features**:
  - Colored terminal output (chalk)
  - Graceful shutdown (SIGINT/SIGTERM)
  - Process management (spawn Vite, manage WebSocket)

## Configuração

### Dashboard (.env)

```bash
VITE_WS_URL=ws://localhost:3001
```

### CLI (dashboard command)

```bash
# Iniciar dashboard com portas customizadas
taskin dashboard --port 8080 --ws-port 3002 --open

# Usar valores padrão
taskin dashboard
```

### MCP Server (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "taskin": {
      "args": ["mcp-server"],
      "command": "taskin",
      "env": {
        "TASKIN_TASKS_DIR": "/path/to/TASKS"
      }
    }
  }
}
```

## Patterns

### Provider Pattern

- **ITaskProvider**: Interface de leitura (findTask, getAllTasks)
- **ITaskManager**: Interface de escrita (updateTask, pauseTask, etc.)
- **Implementações**: FileSystemTaskProvider, PiniaTaskProvider

### WebSocket Protocol

```typescript
// Client → Server
{ type: 'list' }
{ type: 'find', taskId: 'task-01' }
{ type: 'update', task: { id: 'task-01', status: 'in-progress' } }

// Server → Client
{ type: 'tasks', tasks: [...] }
{ type: 'task:found', task: {...} }
{ type: 'task:updated', task: {...} }
{ type: 'error', error: 'message' }
```

### MCP Protocol

```typescript
// Tool call
{
  name: 'start_task',
  arguments: { taskId: 'task-01' }
}

// Tool response
{
  content: [{
    type: 'text',
    text: 'Task started successfully: ...'
  }]
}
```

## Testing

```bash
# Testar servidor WebSocket + Dashboard
taskin dashboard

# Testar servidor MCP
taskin mcp-server --debug

# Testar comandos CLI
taskin start task-01
taskin finish task-01
```

## Deployment

### Dashboard (Production)

```bash
cd packages/dashboard
pnpm build
# Deploy dist/ para CDN/servidor estático
```

### CLI (NPM Package)

```bash
cd packages/cli
pnpm build
pnpm publish
```

### WebSocket Server (Node.js)

```bash
# Usar pm2, systemd, docker, etc.
node -r esbuild-register packages/cli/src/commands/dashboard.ts
```

## Troubleshooting

### TypeScript Errors (Pinia + Zod)

- **Problema**: `usePiniaTaskProvider` inferred type cannot be named
- **Solução**: `skipLibCheck: true` no tsconfig.json + export workaround

### MCP SDK Type Compatibility

- **Problema**: Content type mismatch
- **Solução**: Use `type: 'text' as const` em todos os content objects

### WebSocket Connection Issues

- **Problema**: Auto-reconnect loop
- **Solução**: Configurar `reconnectDelay` e `maxReconnectAttempts`

### Vetur vs Volar

- **Problema**: False positive errors em Vue 3 <script setup>
- **Solução**: Substituir Vetur por Volar (.vscode/extensions.json)

## Roadmap

- [ ] SSE transport para MCP server
- [ ] Testes unitários para CLI commands
- [ ] Integração com Git (commit automático de mudanças em tasks)
- [ ] Dashboard: filtros avançados, busca, ordenação
- [ ] Dashboard: drag-and-drop para mudar status
- [ ] MCP: Mais tools (create_task, delete_task, assign_task)
- [ ] MCP: Recursos avançados (taskin://task/{id}, taskin://metrics)
- [ ] Autenticação/autorização para WebSocket
- [ ] Rate limiting e throttling
- [ ] Métricas e observabilidade (Prometheus, Grafana)

---

**Autor**: OpenTask (https://opentask.com.br)  
**Contribuidor**: Sidarta Veloso
