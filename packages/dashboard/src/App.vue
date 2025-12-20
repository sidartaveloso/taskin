<script setup lang="ts">
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import TaskGrid from './components/templates/TaskGrid.vue';
import type { Task } from './types';

// WebSocket configuration
const wsUrl = ref(
  (window as any).VITE_WS_URL ||
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
  const mapped = taskStore.tasks.map((taskFile: any) => {
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
      status: taskFile.status,
      assignee: taskFile.assignee,
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

// Connection status color
const statusColor = computed(() => {
  if (isConnected.value) return 'var(--color-success)';
  if (connectionError.value) return 'var(--color-error)';
  return 'var(--color-warning)';
});

// Connection status text
const statusText = computed(() => {
  if (isConnected.value) return 'Conectado';
  if (connectionError.value) return 'Erro de conexão';
  return 'Conectando...';
});
</script>

<template>
  <div class="app">
    <!-- Header with connection status -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          Taskin Dashboard
        </h1>

        <div class="connection-status">
          <span
            class="status-indicator"
            :style="{ backgroundColor: statusColor }"
          />
          <span class="status-text">{{ statusText }}</span>

          <button
            v-if="connectionError"
            class="retry-button"
            :disabled="isLoading"
            @click="handleRefresh"
          >
            {{ isLoading ? 'Reconectando...' : 'Tentar novamente' }}
          </button>
        </div>
      </div>

      <!-- Error message -->
      <div
        v-if="connectionError"
        class="error-banner"
      >
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ connectionError }}</span>
      </div>
    </header>

    <!-- Main content -->
    <main class="app-main">
      <!-- Loading state -->
      <div
        v-if="isLoading && tasks.length === 0"
        class="loading-state"
      >
        <div class="spinner" />
        <p>Carregando tarefas...</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!isLoading && tasks.length === 0"
        class="empty-state"
      >
        <p class="empty-icon">
          📋
        </p>
        <h2>Nenhuma tarefa encontrada</h2>
        <p>Conecte-se ao servidor para visualizar suas tarefas.</p>
      </div>

      <!-- Task grid -->
      <TaskGrid
        v-else
        :tasks="tasks"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--color-background, #f5f5f5);
  font-family: var(--font-family-base, 'Ubuntu', system-ui, sans-serif);
}

.app-header {
  background: white;
  border-bottom: 1px solid var(--color-border, #e5e5e5);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-text-primary, #212529);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #495057);
}

.retry-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: var(--color-primary, #169bd7);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover:not(:disabled) {
  background: var(--color-primary-dark, #0d7eb9);
  transform: translateY(-1px);
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background: var(--color-error-bg, #fff5f5);
  border-top: 1px solid var(--color-error-border, #feb2b2);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 1400px;
  margin: 0 auto;
}

.error-icon {
  font-size: 1.25rem;
}

.error-message {
  font-size: 0.875rem;
  color: var(--color-error, #c92a2a);
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

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
