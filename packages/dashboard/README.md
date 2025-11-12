# @opentask/taskin-dashboard

> Vue 3 dashboard components for Taskin - provider-agnostic task visualization with real-time WebSocket sync

## 📦 Installation

```bash
npm install @opentask/taskin-dashboard pinia @opentask/taskin-task-provider-pinia
# or
pnpm add @opentask/taskin-dashboard pinia @opentask/taskin-task-provider-pinia
```

## 🚀 Quick Start

### Standalone App with WebSocket

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@opentask/taskin-dashboard/style.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import { TaskGrid } from '@opentask/taskin-dashboard';

const taskStore = usePiniaTaskProvider();
const tasks = computed(() => taskStore.tasks);

onMounted(() => {
  taskStore.connect({
    url: 'ws://localhost:3001',
    reconnect: true,
  });
});

onUnmounted(() => {
  taskStore.disconnect();
});
</script>

<template>
  <TaskGrid :tasks="tasks" />
</template>
```

### Using Components Only

```vue
<script setup>
import { TaskGrid, TaskCard } from '@opentask/taskin-dashboard';
import '@opentask/taskin-dashboard/style.css';

// Fetch tasks from your provider (filesystem, Redmine, Jira, etc.)
const tasks = await fetchTasks();
</script>

<template>
  <!-- Complete grid with statistics -->
  <TaskGrid :tasks="tasks" :columns="3" />

  <!-- Or use individual TaskCard -->
  <TaskCard :task="tasks[0]" variant="compact" />
</template>
```

## 🌐 Real-Time Synchronization

The dashboard integrates with `@opentask/taskin-task-provider-pinia` for real-time WebSocket updates:

- 🔄 **Auto-reconnect** - Handles connection drops gracefully
- 💓 **Heartbeat** - Keeps connection alive with ping/pong
- 📡 **Live updates** - Tasks sync in real-time across all clients
- 💾 **Offline cache** - Works with cached data when offline

**Environment Variables:**

```env
VITE_WS_URL=ws://localhost:3001
```

**TaskGrid Features:**

- 📊 **Statistics header** - Shows total, in-progress, blocked, paused counts
- 📱 **Fully responsive** - Adapts from 4 cols → 3 cols → 2 cols → 1 col
- ⏳ **Loading state** - Built-in spinner for async data
- 📋 **Empty state** - Customizable message when no tasks
- 🎨 **Flexible** - Configurable columns, gaps, and card variants
- 🔌 **Connection status** - Shows WebSocket connection state

## 🎯 Philosophy

This package is **provider-agnostic** - it visualizes task data through well-defined TypeScript interfaces, without coupling to any specific task provider (filesystem, Redmine, Jira, etc.).

### 🔄 Hybrid Props Pattern

The `TaskCard` organism uses a **hybrid approach**:

- ✅ **Production**: Pass complete `Task` object for convenience and type safety
- ✅ **Storybook**: Use individual props for interactive controls and testing
- ✅ **Flexibility**: Mix both approaches - individual props override Task object

## 📚 Components

### Atoms

- ✅ **Badge** - Task numbers, status indicators, tags
- ✅ **Avatar** - User avatars with initials fallback
- ✅ **ProgressBar** - Task completion progress

### Molecules

- ✅ **TaskHeader** - User info with avatar and email
- ✅ **DateIndicator** - Formatted date display
- ✅ **TimeEstimate** - Estimated/spent/remaining hours with status colors
- ✅ **ProjectBreadcrumb** - Project path with ellipsis support
- ✅ **DayBar** - Daily progress bar with date and description

### Organisms

- ✅ **TaskCard** - Complete task card integrating all atoms and molecules

### Templates

- ✅ **TaskGrid** - Responsive grid layout with statistics, loading, and empty states

## 🛠 Development

```bash
# Install dependencies
pnpm install

# Run Storybook (with Storybook 10 features!)
pnpm storybook

# Build library
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## 🎬 Complete Example

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { TaskGrid } from '@opentask/taskin-dashboard';
import '@opentask/taskin-dashboard/style.css';

const tasks = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    // Fetch from your task provider (filesystem, Redmine, Jira, etc.)
    const response = await fetch('/api/tasks');
    tasks.value = await response.json();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    loading.value = false;
  }
});

// Auto-refresh every 30 seconds
setInterval(async () => {
  const response = await fetch('/api/tasks');
  tasks.value = await response.json();
}, 30000);
</script>

<template>
  <TaskGrid
    :tasks="tasks"
    :loading="loading"
    :columns="3"
    gap="lg"
    empty-message="Nenhuma tarefa em andamento"
  >
    <template #title> 🚀 Sprint 23 - Dashboard </template>

    <template #footer>
      <div style="text-align: center; color: #666;">
        Atualizado automaticamente a cada 30 segundos
      </div>
    </template>
  </TaskGrid>
</template>
```

## 📖 Storybook

```

## 📖 Storybook 10 Features

Este projeto usa **Storybook 10.0.7** com recursos avançados:

### ✨ Recursos Ativos

- **📚 Auto-docs** - Documentação gerada automaticamente para cada componente
- **🎨 Backgrounds** - Teste componentes em diferentes fundos (light/dark/gray)
- **📱 Viewports** - Viewports customizados (Mobile, Tablet, Desktop, TV Display)
- **⚙️ Controls** - Controles interativos com props ordenadas por obrigatoriedade
- **📋 Table of Contents** - Índice automático na documentação
- **🎯 Centered Layout** - Componentes centralizados por padrão
- **📝 MDX Docs** - Documentação rica com Markdown

### 🎮 Como usar

1. Rode `pnpm storybook` e acesse http://localhost:6006
2. Use a **toolbar** superior para:
   - 🎨 Mudar background (light/dark/gray)
   - 📱 Testar em diferentes viewports
   - 📏 Ajustar zoom
   - 🌐 Visualizar em modo fullscreen
3. Use **Controls** no painel direito para testar props interativamente
4. Clique em **Docs** para ver documentação completa

## 📖 Storybook

Interactive component documentation and live examples:
pnpm storybook

# Build library

pnpm build

# Run tests

pnpm test

# Type check

pnpm typecheck

```

## 📖 Storybook

Interactive component documentation and live examples:

```bash
pnpm storybook
```

## 🧪 Testing

Tests use Vitest + Vue Test Utils:

```bash
pnpm test        # Run tests
pnpm test:ui     # Run with UI
```

## 📝 License

MIT

## 🔗 Related Packages

- `@opentask/taskin-core` - Core types and interfaces
- `@opentask/taskin-fs-provider` - Filesystem task provider
- `taskin` - CLI tool
