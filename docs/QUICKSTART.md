# Guia de Início Rápido - Taskin

## Instalação

### Pré-requisitos

- Node.js >= 18
- pnpm >= 8

### Setup do Monorepo

```bash
# Clone o repositório
git clone https://github.com/opentask/taskin.git
cd taskin

# Instale as dependências
pnpm install

# Build todos os pacotes
pnpm -r build
```

## Uso Básico

### 1. Gerenciar Tarefas via CLI

```bash
# Inicializar estrutura de tasks
taskin init

# Listar todas as tarefas
taskin list

# Criar nova tarefa
taskin new "Implementar autenticação"

# Iniciar uma tarefa
taskin start task-01

# Pausar uma tarefa
taskin pause task-01

# Finalizar uma tarefa
taskin finish task-01

# Validar arquivos de tasks
taskin lint
```

### 2. Dashboard Web com Sincronização Real-Time

```bash
# Iniciar WebSocket server + Vite dev server
taskin dashboard

# Ou com portas customizadas
taskin dashboard --port 8080 --ws-port 3002 --host 0.0.0.0 --open
```

O dashboard estará disponível em:

- **Dashboard**: http://localhost:5173
- **WebSocket**: ws://localhost:3001

#### O que você verá:

- 📊 Grade responsiva com todas as tarefas
- 🔄 Atualizações em tempo real via WebSocket
- ⚡ Status de conexão (conectado/desconectado/reconectando)
- 📱 Interface responsiva

### 3. Integração com LLMs (Claude, GPT-4)

#### Configurar Claude Desktop

1. Edite `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskin": {
      "args": ["mcp-server"],
      "command": "taskin",
      "env": {
        "TASKIN_TASKS_DIR": "/Users/seu-usuario/projetos/TASKS"
      }
    }
  }
}
```

2. Reinicie Claude Desktop

3. Use os comandos do Taskin:

```
Você: "Start task task-01"
Claude: [Usa o tool start_task]
Claude: "✓ Task started successfully: task-01-implementar-autenticacao"

Você: "What tasks are in progress?"
Claude: [Usa o resource taskin://tasks]
Claude: "You have 2 tasks in progress: ..."
```

#### Iniciar servidor MCP diretamente

```bash
# Modo stdio (padrão)
taskin mcp-server

# Com debug habilitado
taskin mcp-server --debug

# Modo SSE (planejado)
taskin mcp-server --transport sse
```

#### Tools Disponíveis

- `start_task`: Inicia uma tarefa (muda status para in-progress)
- `finish_task`: Finaliza uma tarefa (muda status para done)

#### Prompts Disponíveis

- `start-task-workflow`: Workflow para iniciar tarefa
- `finish-task-workflow`: Workflow para finalizar tarefa
- `task-summary`: Resumo de tarefas

#### Resources Disponíveis

- `taskin://tasks`: Lista de todas as tarefas

## Estrutura de Arquivos

### Diretório de Tarefas

Por padrão, as tarefas ficam em `./TASKS/`:

```
TASKS/
├── task-01-implementar-autenticacao.md
├── task-02-criar-dashboard.md
└── task-03-integrar-mcp.md
```

### Formato de Tarefa

Cada tarefa é um arquivo Markdown com frontmatter YAML:

```markdown
---
id: task-01
title: Implementar autenticação
status: in-progress
priority: high
tags:
  - backend
  - security
assignee: sidarta
created: 2024-01-15T10:00:00Z
updated: 2024-01-15T15:30:00Z
---

## Descrição

Implementar sistema de autenticação JWT com refresh tokens.

## Checklist

- [x] Criar schema de usuários
- [x] Implementar login endpoint
- [ ] Implementar refresh token
- [ ] Adicionar middleware de autenticação
```

## Desenvolvimento

### Criar Novo Package

```bash
# Criar estrutura
mkdir -p packages/novo-package/src
cd packages/novo-package

# Criar package.json
cat > package.json << EOF
{
  "name": "@opentask/taskin-novo-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "typecheck": "tsc --noEmit"
  }
}
EOF

# Criar tsconfig.json
cat > tsconfig.json << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
EOF

# Voltar para root e instalar
cd ../..
pnpm install
```

### Adicionar Dependência entre Packages

```json
// packages/novo-package/package.json
{
  "dependencies": {
    "@opentask/taskin-task-manager": "workspace:*",
    "@opentask/taskin-types-ts": "workspace:*"
  }
}
```

```bash
# Reinstalar
pnpm install
```

### Build e Watch

```bash
# Build todos os packages
pnpm -r build

# Watch mode em um package específico
cd packages/dashboard
pnpm dev

# Build apenas CLI
pnpm --filter @opentask/taskin-cli build
```

### Testes

```bash
# Rodar todos os testes
pnpm test

# Testes de um package específico
cd packages/core
pnpm test

# Coverage
pnpm test:coverage
```

## Integração Programática

### Usar PiniaTaskProvider em Vue 3

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';

const taskStore = usePiniaTaskProvider({
  websocketUrl: 'ws://localhost:3001',
  autoConnect: true,
  reconnectDelay: 5000,
});

// Conectar ao servidor
taskStore.connect();

// Buscar todas as tarefas
const tasks = computed(() => taskStore.tasks);

// Buscar tarefas por status
const inProgress = computed(() => taskStore.tasksByStatus('in-progress'));

// Atualizar uma tarefa
const startTask = (taskId: string) => {
  taskStore.send({
    type: 'update',
    task: { id: taskId, status: 'in-progress' },
  });
};
</script>

<template>
  <div>
    <h1>Tasks</h1>
    <div v-if="taskStore.loading">Loading...</div>
    <div v-else-if="taskStore.error">Error: {{ taskStore.error }}</div>
    <ul v-else>
      <li v-for="task in tasks" :key="task.id">
        {{ task.title }} - {{ task.status }}
        <button @click="startTask(task.id)">Start</button>
      </li>
    </ul>
  </div>
</template>
```

### Usar TaskWebSocketServer em Node.js

```typescript
// server.ts
import { TaskWebSocketServer } from '@opentask/taskin-task-server-ws';
import { TaskManager } from '@opentask/taskin-task-manager';
import { FileSystemTaskProvider } from '@opentask/taskin-file-system-provider';

const tasksDir = './TASKS';
const taskProvider = new FileSystemTaskProvider(tasksDir);
const taskManager = new TaskManager(taskProvider);

const server = new TaskWebSocketServer({
  taskManager,
  taskProvider,
  options: {
    port: 3001,
    host: 'localhost',
    heartbeatInterval: 30000,
  },
});

// Iniciar servidor
await server.start();
console.log('WebSocket server running on ws://localhost:3001');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await server.stop();
  process.exit(0);
});
```

### Usar TaskMCPServer Programaticamente

```typescript
// mcp-server.ts
import { TaskMCPServer } from '@opentask/taskin-task-server-mcp';
import { TaskManager } from '@opentask/taskin-task-manager';
import { FileSystemTaskProvider } from '@opentask/taskin-file-system-provider';

const tasksDir = './TASKS';
const taskProvider = new FileSystemTaskProvider(tasksDir);
const taskManager = new TaskManager(taskProvider);

const mcpServer = new TaskMCPServer({
  taskManager,
  taskProvider,
  name: 'taskin',
  version: '0.1.0',
});

// Iniciar servidor (stdio)
await mcpServer.start({ transport: 'stdio' });

// Servidor fecha automaticamente quando processo termina
```

## Troubleshooting

### Build Errors

```bash
# Limpar tudo e reconstruir
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm -r build
```

### TypeScript Errors

```bash
# Verificar tipos em todos os packages
pnpm -r typecheck

# Package específico
cd packages/dashboard
pnpm typecheck
```

### WebSocket Não Conecta

1. Verifique se o servidor está rodando:

   ```bash
   taskin dashboard
   ```

2. Verifique a variável de ambiente:

   ```bash
   # packages/dashboard/.env
   VITE_WS_URL=ws://localhost:3001
   ```

3. Verifique o console do navegador (F12 → Console)

### MCP Server Não Aparece no Claude

1. Verifique o caminho do comando `taskin` em `claude_desktop_config.json`

2. Verifique se o CLI está instalado globalmente:

   ```bash
   npm link packages/cli
   ```

3. Reinicie Claude Desktop completamente

4. Verifique logs do Claude:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

## Recursos Adicionais

- 📚 [Documentação de Arquitetura](./ARCHITECTURE.md)
- 🎨 [Design Specifications](../packages/dashboard/docs/design-specifications.md)
- 🔌 [WebSocket Examples](../packages/task-server-ws/EXAMPLES.md)
- 🤖 [MCP Server README](../packages/task-server-mcp/README.md)
- 📦 [Pinia Provider README](../packages/task-provider-pinia/README.md)

## Próximos Passos

1. **Explorar o Dashboard**

   ```bash
   taskin dashboard --open
   ```

2. **Integrar com Claude**
   - Configure o MCP server
   - Teste os comandos de task management

3. **Criar Custom Provider**
   - Implemente `ITaskProvider`
   - Use em lugar do `FileSystemTaskProvider`

4. **Contribuir**
   - Fork o repositório
   - Crie um branch para sua feature
   - Envie um Pull Request

---

**Dúvidas?** Abra uma issue no GitHub!
