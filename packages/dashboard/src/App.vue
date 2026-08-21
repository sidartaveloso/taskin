<template>
  <div class="mode-toggle">
    <button
      type="button"
      :class="{ active: mode === 'board' }"
      @click="mode = 'board'"
    >
      Board
    </button>
    <button
      type="button"
      :class="{ active: mode === 'prioritization' }"
      @click="mode = 'prioritization'"
    >
      Priorização
    </button>
  </div>

  <Dashboard
    v-if="mode === 'board'"
    title="Taskin Dashboard"
    :connection-status="connectionStatusType"
    :status-text="statusText"
    :error-message="connectionError || ''"
    :show-retry="!!connectionError"
    :is-retrying="isLoading"
    :is-loading="isLoading"
    :tasks="tasks"
    @retry="handleRefresh"
  />
  <PrioritizationPage v-else :tasks="tasks" @update-task="handleUpdateTask" />
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '@opentask/taskin-design-vue';
import { Dashboard, PrioritizationPage } from '@opentask/taskin-design-vue';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';

// Progress bar filled per status.
//
// This map is where the domain's status union and the design system's have to
// agree, and it checks both directions: annotating it `Record<TaskStatus, …>`
// means a status added to the design system must be handled here, and indexing
// it with the store's status (below) means a status added to the domain must be
// renderable. Neither side can grow a status the other silently ignores — which
// is how `paused` sat in the design system, unreachable, for so long.
const PROGRESS_BY_STATUS: Record<TaskStatus, number> = {
  pending: 0,
  'in-progress': 50,
  paused: 30,
  'in-review': 75,
  done: 100,
  blocked: 20,
  canceled: 0,
};

const mode = ref<'board' | 'prioritization'>('board');

// WebSocket configuration
const wsUrl = ref(
  (window as Window & { VITE_WS_URL?: string }).VITE_WS_URL || import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
);
const reconnectDelay = ref(5000);

// Initialize Pinia task store
const taskStore = usePiniaTaskProvider();

// Connection status
const connectionStatus = computed(() => taskStore.connectionStatus);
const isConnected = computed(() => connectionStatus.value.connected);
const connectionError = computed(() => connectionStatus.value.error);

// Map the store's provider-agnostic tasks onto the dashboard's Task view model.
// The shape comes from the store, so there is no structural type to restate here.
const tasks = computed<Task[]>(() => {
  const filter = new URLSearchParams(window.location.search).get('filter');

  let filtered = taskStore.tasks;
  if (filter === 'open') {
    filtered = taskStore.tasks.filter((t) => t.status !== 'done' && t.status !== 'canceled');
  } else if (filter === 'closed') {
    filtered = taskStore.tasks.filter((t) => t.status === 'done' || t.status === 'canceled');
  }

  const mapped = filtered.map((source) => {
    const progressPercentage = PROGRESS_BY_STATUS[source.status];

    const task: Task = {
      id: source.id,
      number: parseInt(source.id, 10) || 0,
      title: source.title,
      description: source.description ?? '',
      status: source.status,
      assignee: source.assignee
        ? {
            id: source.assignee.id,
            name: source.assignee.name,
            email: source.assignee.email,
            avatar: source.assignee.avatar,
          }
        : undefined,
      dates: {
        created: source.createdAt || new Date().toISOString(),
      },
      tags: source.type ? [source.type] : [],
      progress: {
        percentage: progressPercentage,
      },
      type: source.type,
      order: source.order,
      groupId: source.groupId,
      groupName: source.groupName,
      difficulty: source.difficulty,
    };

    console.log('Mapped task:', task.id, 'assignee:', task.assignee);

    return task;
  });

  return mapped;
});

const isLoading = computed(() => taskStore.loading);

// Connect on mount
onMounted(() => {
  taskStore.connect({
    wsUrl: wsUrl.value,
    autoReconnect: true,
    reconnectDelay: reconnectDelay.value,
  });
});

// Disconnect on unmount
onUnmounted(() => {
  taskStore.disconnect();
});

// Refresh handler
const handleRefresh = () => {
  taskStore.getAllTasks();
};

// Persist a prioritization change (order/group/difficulty) coming from PrioritizationPage
const handleUpdateTask = (task: Task) => {
  const original = taskStore.tasks.find((t) => t.id === task.id);
  if (!original) return;

  taskStore.updateTask({
    ...original,
    order: task.order,
    groupId: task.groupId,
    groupName: task.groupName,
    difficulty: task.difficulty,
  });
};

// Connection status type for header component
const connectionStatusType = computed<'connected' | 'disconnected' | 'connecting' | 'error'>(() => {
  if (isConnected.value) return 'connected';
  if (connectionError.value) return 'error';
  return 'connecting';
});

// Connection status text
const statusText = computed(() => {
  if (isConnected.value) return 'Conectado';
  if (connectionError.value) return 'Erro de conexão';
  return 'Conectando...';
});
</script>

<style>
/* Global styles - apply design-vue variables to body */
body {
  margin: 0;
  padding: 0;
  background: var(--bg-body);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.mode-toggle {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-card, #fff);
  border-bottom: 1px solid var(--border-muted, #e5e5e5);
}

.mode-toggle button {
  background: transparent;
  border: 1px solid var(--border-muted, #e5e5e5);
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary, #212529);
}

.mode-toggle button.active {
  background: var(--status-progress-bg, #169bd7);
  color: #fff;
  border-color: transparent;
}

/* Page-specific styles */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border, #e5e5e5);
  border-top-color: var(--color-primary, #169bd7);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.empty-state p {
  color: var(--color-text-secondary, #495057);
  margin: 0.5rem 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-text-primary, #212529);
  margin-bottom: 0.5rem;
}
</style>
