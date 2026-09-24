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
│  ├─ Port: 3001              ├─ Transport: stdio            │
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
│  ├─ ITaskManager (write): startTask, setPriority, etc.     │
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
usePiniaTaskProvider().operar({ type: 'set-priority', payload: { taskId, priority } })
    ↓
WebSocket Client (ws://localhost:3001)
    ↓
TaskWebSocketServer.handleMessage()   (uma mensagem por vez, na ordem)
    ↓
TaskManager.setPriority()             (a mesma operacao da CLI e do MCP)
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

No quadro de priorizacao, mover (setas, topo, fim, arrastar) nao calcula numero
no navegador: o `usePrioritization` emite um movimento com a linha visivel de
referencia, o `App.vue` o traduz em `move-before`/`move-after` ou
`move-group-before`/`move-group-after`, e a ordem nova chega na lista que o
servidor devolve. O desfazer guarda os valores anteriores e reenvia
`set-priority` (e `assign-to-group`/`remove-from-group`) so para as tarefas que
a operacao alterou.

Soltar uma tarefa sobre outra do mesmo grupo cria um subgrupo de verdade
(`create-group` com `parentId`, e `assign-to-group` das duas); soltar um grupo
sobre outro cria um pai com os dois dentro (`create-group` e `nest-group`). O
quadro recebe os grupos com o pai e monta a arvore a partir deles, e a pagina
emite `update-group` antes de `update-task` — o grupo existe antes de alguem
entrar nele. Desfazer um aninhamento sai como `unnest-group`. Ver
[RDT/grupos-aninhados.md](./RDT/grupos-aninhados.md).

### 2. MCP Flow (LLM ↔ TaskManager)

```
LLM Request (Claude/GPT-4)
    ↓
MCP Client (stdio)
    ↓
TaskMCPServer.handleToolCall('start_task')
    ↓
TaskManager.startTask(taskId)
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
- **Principais métodos**: `startTask()`, `pauseTask()`, `finishTask()`, `assignToGroup()`, `setPriority()`, `moveBefore()`, `moveToTop()`, `moveToBottom()`, `moveGroupBefore()`, `moveGroupToTop()`, `createGroup()`, `nestGroup()`, `unnestGroup()`, `setDifficulty()`
- **Portão**: `SUPERFICIES_DAS_OPERACOES` declara onde cada operação aparece (CLI, MCP, WebSocket); operação sem as três decididas não compila

#### @opentask/taskin-file-system-provider

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
  - `taskin dashboard` (serve `/avatar/<hash>` como proxy: o navegador nunca
    fala com o provedor de avatar, e sem internet cai para as iniciais): Inicia WebSocket server + Vite dev server
    - `--port <number>`: Porta do Vite (padrão: 5173)
    - `--ws-port <number>`: Porta do WebSocket (padrão: 3001)
    - `--host <string>`: Host do servidor (padrão: localhost)
    - `--open`: Abre navegador automaticamente
  - `taskin mcp-server`: Inicia MCP server (transporte stdio; sem porta)
    - `--debug`: Ativa logs de debug
  - `taskin mcp-install`: Registra o MCP server no `.mcp.json` do projeto
    - `-f, --force`: Substitui uma entrada `taskin` divergente
    - `--no-probe`: Pula a subida do servidor para verificar a entrada
  - `taskin start/finish/pause/review <task-id>`: Comandos de task management
    - `--no-skip-ci`: Escreve o commit de status sem a marca de pular CI, para o
      push que carrega trabalho junto (o GitHub lê só o commit de topo)
- **Features**:
  - Colored terminal output (chalk)
  - Graceful shutdown (SIGINT/SIGTERM)
  - Process management (spawn Vite, manage WebSocket)

## Configuração

### Mascote — reação a ruído ("xiiu/shhh")

O bloco opcional `mascot` do `.taskin.json` configura a reação do mascote ao
ruído ambiente, validado por `MascotConfigSchema` em `@opentask/taskin-types`:

```json
{
  "mascot": {
    "reactions": {
      "noise": {
        "enabled": true,
        "threshold": 0.7,
        "debounceMs": 5000,
        "sound": true,
        "phrase": "Bruno, Shhhhhhhhhhhh...",
        "volume": 1
      }
    }
  }
}
```

Os campos têm defaults conservadores (`enabled: false`, `threshold: 0.06`,
`debounceMs: 1500`, `sound: false`) — sem `enabled: true` explícito o microfone
nunca é solicitado. `phrase` (default `"Shhhhhh..."`) é o que o mascote fala em
voz alta e mostra no balão, e `volume` (default `1`) é a altura desse som.
Dirigir o pedido a alguém — `"Bruno, Shhhhhhhhhhhh..."` — é o ponto: quem está
falando alto não está olhando para a tela, e é o mascote quem pede silêncio no
lugar da pessoa que precisa se concentrar.

Com `sound: true` saem duas camadas, e a segunda nunca falta: a **fala**, pelo
`speechSynthesis` do próprio navegador, e o **chiado**, sintetizado com Web
Audio (ruído branco por um filtro de banda alta, que é literalmente o que uma
sibilante é). Não há arquivo de áudio para baixar, licenciar ou versionar, e a
duração do chiado acompanha os `h` da frase. O navegador só libera áudio depois
de um gesto do usuário na página — antes disso o balão aparece e o som não. As funções puras `resolveMascotNoiseSettings` e
`resolveShhhReactionPlan` (mesmo pacote) derivam, respectivamente, as
configurações com defaults aplicados e o plano da reação (honrando
`prefers-reduced-motion`). O organismo `TaskinWithShhh`
(`@opentask/taskin-design-vue`) consome esse bloco.

Consulte `packages/design-vue/docs/MASCOT_NOISE_REACTION.md` para o guia
completo (props, acessibilidade, privacidade e testes).

O pacote `@opentask/taskin-mascote` é esse organismo empacotado como aplicação
instalável: o Taskin em tela cheia num celular apoiado abaixo do monitor,
publicado junto do site em `/taskin/mascote/`. Ele não lê `.taskin.json` — não
há arquivo num aparelho —, mas grava no `localStorage` um bloco `mascot` no
**mesmo formato**, lido pela mesma `resolveMascotNoiseSettings`, de modo que o
que se ajusta no celular pode ser colado no arquivo de um projeto. Ver
`packages/mascote/README.md`.

## Métricas e Analytics

O Taskin separa agora as responsabilidades de armazenamento das responsabilidades
de métricas/analytics através da interface `IMetricsManager` definida em
`packages/task-manager/src/metrics.types.ts`.

- `IMetricsManager` fornece métodos: `getUserMetrics`, `getTeamMetrics`,
  `getTaskMetrics`.
- Os tipos retornados (`UserStats`, `TeamStats`, `TaskStats`) vêm do pacote
  `@opentask/taskin-types`.

Implementações concretas (por exemplo, `FsMetricsAdapter`) devem ser
registradas separadamente do `ITaskProvider` e podem agregar dados a partir
de várias fontes (arquivos locais, git, APIs externas) para produzir os
relatórios.

Consulte `docs/METRICS.md` para detalhes, exemplos e diretrizes de
migração.

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
- **ITaskManager**: Operações de domínio nomeadas (startTask, setPriority, assignToGroup, etc.)
- **Implementações**: FileSystemTaskProvider, PiniaTaskProvider

### WebSocket Protocol

```typescript
// Client → Server: consultas e operacoes nomeadas (nao ha `update` generico)
{ type: 'list' }
{ type: 'find', payload: { taskId: '001' } }
{ type: 'start', payload: { taskId: '001' } }
{ type: 'set-priority', payload: { taskId: '001', priority: 30 } }
{ type: 'assign-to-group', payload: { taskId: '001', groupId: 'g-sprint' } }
{ type: 'move-before', payload: { taskId: '001', targetId: '002' } }
// ... ver a tabela completa em packages/task-server-ws/README.md

// Server → Client
{ type: 'tasks', payload: [...] }
{ type: 'task:found', payload: {...} }
{ type: 'task:updated', payload: {...} }
{ type: 'error', payload: { message: '...' } }
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
