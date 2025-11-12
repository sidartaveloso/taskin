# Exemplos de Uso - Task Provider Pinia & Task Server WS

## 🎯 Visão Geral

Este documento demonstra como usar os packages `task-provider-pinia` e `task-server-ws` para criar um sistema de gerenciamento de tarefas em tempo real.

## 📦 Packages

### 1. @opentask/taskin-task-provider-pinia

Provider Pinia que implementa `ITaskProvider` com sincronização WebSocket em tempo real.

### 2. @opentask/taskin-task-server-ws

Servidor WebSocket que expõe `ITaskManager` e `ITaskProvider` para múltiplos clientes.

---

## 🚀 Exemplo 1: Servidor WebSocket Standalone

```typescript
// server.ts
import { TaskManager } from '@opentask/taskin-task-manager';
import { FileSystemTaskProvider } from '@opentask/taskin-fs-task-provider';
import { createTaskWebSocketServer } from '@opentask/taskin-task-server-ws';

async function startServer() {
  // 1. Criar provider de tarefas
  const taskProvider = new FileSystemTaskProvider('./TASKS');

  // 2. Criar task manager
  const taskManager = new TaskManager(taskProvider);

  // 3. Iniciar servidor WebSocket
  const server = await createTaskWebSocketServer(taskManager, taskProvider, {
    port: 3001,
    host: 'localhost',
    debug: true,
    maxClients: 50,
    heartbeatInterval: 30000,
  });

  console.log('✅ Task WebSocket Server running on ws://localhost:3001');

  // 4. Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down server...');
    await server.stop();
    process.exit(0);
  });
}

startServer().catch(console.error);
```

---

## 🎨 Exemplo 2: Vue Dashboard com Pinia

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import TaskGrid from './components/TaskGrid.vue';

const taskStore = usePiniaTaskProvider();

onMounted(() => {
  // Conectar ao servidor WebSocket
  taskStore.connect({
    wsUrl: 'ws://localhost:3001',
    autoReconnect: true,
    reconnectDelay: 5000,
    debug: import.meta.env.DEV,
  });
});

onUnmounted(() => {
  // Desconectar ao sair
  taskStore.disconnect();
});
</script>

<template>
  <div class="app">
    <header>
      <h1>Taskin Dashboard</h1>
      <div
        class="connection-status"
        :class="{ connected: taskStore.connected }"
      >
        {{ taskStore.connected ? '🟢 Connected' : '🔴 Disconnected' }}
      </div>
    </header>

    <main>
      <TaskGrid :tasks="taskStore.tasks" />
    </main>
  </div>
</template>
```

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

---

## 🔌 Exemplo 3: Usando ITaskProvider Adapter

```typescript
// api.ts
import { createPiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import type { ITaskProvider } from '@opentask/taskin-task-manager';

// Criar adapter ITaskProvider a partir da store Pinia
export const taskProvider: ITaskProvider = createPiniaTaskProvider({
  wsUrl: 'ws://localhost:3001',
  autoReconnect: true,
  debug: false,
});

// Usar em qualquer lugar
export async function loadTasks() {
  const tasks = await taskProvider.getAllTasks();
  return tasks;
}

export async function getTask(id: string) {
  const task = await taskProvider.findTask(id);
  return task;
}

export async function updateTask(task: TaskFile) {
  await taskProvider.updateTask(task);
}
```

---

## 📊 Exemplo 4: Composable Vue

```typescript
// composables/useTasks.ts
import { computed } from 'vue';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';

export function useTasks() {
  const store = usePiniaTaskProvider();

  const tasks = computed(() => store.tasks);
  const loading = computed(() => store.loading);
  const connected = computed(() => store.connected);
  const error = computed(() => store.error);

  // Filtros úteis
  const todoTasks = computed(() => store.tasksByStatus('pending'));

  const inProgressTasks = computed(() => store.tasksByStatus('in-progress'));

  const doneTasks = computed(() => store.tasksByStatus('done'));

  // Ações
  async function loadTasks() {
    return await store.getAllTasks();
  }

  async function updateTask(task: TaskFile) {
    await store.updateTask(task);
  }

  function getTaskById(id: string) {
    return store.taskById(id);
  }

  return {
    // Estado
    tasks,
    loading,
    connected,
    error,
    // Filtros
    todoTasks,
    inProgressTasks,
    doneTasks,
    // Ações
    loadTasks,
    updateTask,
    getTaskById,
  };
}
```

```vue
<!-- TaskList.vue -->
<script setup lang="ts">
import { useTasks } from '@/composables/useTasks';

const { todoTasks, inProgressTasks, doneTasks, loading, connected } =
  useTasks();
</script>

<template>
  <div class="task-list">
    <section class="status-warning" v-if="!connected">
      ⚠️ Disconnected from server
    </section>

    <section>
      <h2>📋 To Do ({{ todoTasks.length }})</h2>
      <TaskCard v-for="task in todoTasks" :key="task.id" :task="task" />
    </section>

    <section>
      <h2>⚡ In Progress ({{ inProgressTasks.length }})</h2>
      <TaskCard v-for="task in inProgressTasks" :key="task.id" :task="task" />
    </section>

    <section>
      <h2>✅ Done ({{ doneTasks.length }})</h2>
      <TaskCard v-for="task in doneTasks" :key="task.id" :task="task" />
    </section>
  </div>
</template>
```

---

## 🧪 Exemplo 5: Testes

```typescript
// task-provider.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import {
  MockWebSocket,
  createMockTasks,
} from '@opentask/taskin-task-provider-pinia';

describe('PiniaTaskProvider', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.WebSocket = MockWebSocket as any;
  });

  it('should connect to WebSocket server', async () => {
    const store = usePiniaTaskProvider();

    store.connect({
      wsUrl: 'ws://localhost:3001',
      debug: false,
    });

    // Simular conexão
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.connected).toBe(true);
  });

  it('should receive tasks from server', async () => {
    const store = usePiniaTaskProvider();
    const mockTasks = createMockTasks(5);

    store.connect({ wsUrl: 'ws://localhost:3001' });

    // Simular mensagem do servidor
    store.handleMessage({
      type: 'tasks',
      payload: mockTasks,
      timestamp: Date.now(),
    });

    expect(store.tasks).toHaveLength(5);
  });
});
```

---

## 🎯 Protocolo WebSocket

### Mensagens do Cliente → Servidor

```typescript
// Listar todas as tarefas
{
  type: 'list',
  requestId: 'uuid-123'
}

// Buscar tarefa específica
{
  type: 'find',
  payload: { taskId: '550e8400-e29b-41d4-a716-446655440000' },
  requestId: 'uuid-124'
}

// Atualizar tarefa
{
  type: 'update',
  payload: { /* TaskFile completo */ }
}

// Iniciar tarefa
{
  type: 'start',
  payload: { taskId: '550e8400-...' }
}

// Finalizar tarefa
{
  type: 'finish',
  payload: { taskId: '550e8400-...' }
}

// Heartbeat
{
  type: 'ping'
}
```

### Mensagens do Servidor → Cliente

```typescript
// Lista de tarefas
{
  type: 'tasks',
  payload: [/* array de TaskFile */],
  timestamp: 1699999999999
}

// Tarefa encontrada
{
  type: 'task:found',
  payload: { /* TaskFile */ },
  requestId: 'uuid-123'
}

// Tarefa atualizada (broadcast)
{
  type: 'task:updated',
  payload: { /* TaskFile */ },
  timestamp: 1699999999999
}

// Tarefa criada (broadcast)
{
  type: 'task:created',
  payload: { /* TaskFile */ },
  timestamp: 1699999999999
}

// Erro
{
  type: 'error',
  payload: { message: 'Error message' },
  timestamp: 1699999999999
}

// Heartbeat response
{
  type: 'pong',
  timestamp: 1699999999999
}
```

---

## 📝 Notas Importantes

1. **Offline-first**: O Pinia store mantém cache local das tasks, funcionando mesmo desconectado
2. **Auto-reconnect**: Reconexão automática em caso de queda de conexão
3. **Heartbeat**: Ping/pong a cada 10s para manter conexão viva
4. **Broadcast**: Mudanças são automaticamente propagadas para todos os clientes conectados
5. **Type-safe**: Todas as interfaces são fortemente tipadas com TypeScript

---

## 🔗 Próximos Passos

1. Implementar autenticação no servidor WebSocket
2. Adicionar suporte a rooms/channels para múltiplos projetos
3. Implementar histórico de mudanças (event sourcing)
4. Adicionar compressão de mensagens (gzip)
5. Implementar rate limiting
