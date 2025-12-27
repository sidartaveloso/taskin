<template>
  <Dashboard
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
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '@opentask/taskin-design-vue';
import { Dashboard } from '@opentask/taskin-design-vue';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';

// WebSocket configuration
const wsUrl = ref(
  (window as Window & { VITE_WS_URL?: string }).VITE_WS_URL ||
    import.meta.env.VITE_WS_URL ||
    'ws://localhost:3001',
);
const reconnectDelay = ref(5000);

// Initialize Pinia task store
const taskStore = usePiniaTaskProvider();

// Connection status
const connectionStatus = computed(() => taskStore.connectionStatus);
const isConnected = computed(() => connectionStatus.value.connected);
const connectionError = computed(() => connectionStatus.value.error);

// Map TaskFile[] to Task[] for the dashboard
const tasks = computed<Task[]>(() => {
  const mapped = taskStore.tasks.map(
    (taskFile: {
      status: string;
      id: string;
      title: string;
      content: string;
      createdAt: string;
      type?: string;
      assignee?: { id: string; name: string };
    }) => {
      // Calculate progress based on status
      let progressPercentage = 0;
      switch (taskFile.status) {
        case 'done':
          progressPercentage = 100;
          break;
        case 'in-progress':
          progressPercentage = 50;
          break;
        case 'paused':
          progressPercentage = 30;
          break;
        case 'pending':
          progressPercentage = 0;
          break;
        case 'blocked':
          progressPercentage = 20;
          break;
      }

      const task: Task = {
        id: taskFile.id,
        number: parseInt(taskFile.id, 10) || 0,
        title: taskFile.title,
        description: taskFile.content,
        status: taskFile.status as TaskStatus,
        assignee: taskFile.assignee
          ? { id: taskFile.assignee.id, name: taskFile.assignee.name }
          : undefined,
        dates: {
          created: taskFile.createdAt || new Date().toISOString(),
        },
        tags: taskFile.type ? [taskFile.type] : [],
        progress: {
          percentage: progressPercentage,
        },
      };

      // Debug log
      console.log('Mapped task:', task.id, 'assignee:', task.assignee);

      return task;
    },
  );

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

// Connection status type for header component
const connectionStatusType = computed<
  'connected' | 'disconnected' | 'connecting' | 'error'
>(() => {
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
