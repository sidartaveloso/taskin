<template>
  <DashboardLayout
    :title="title"
    :connection-status="connectionStatus"
    :status-text="statusText"
    :error-message="errorMessage"
    :show-retry="showRetry"
    :is-retrying="isRetrying"
    @retry="$emit('retry')"
  >
    <!-- Loading state -->
    <div class="loading-state" v-if="isLoading && (tasks ?? []).length === 0">
      <div class="spinner" />
      <p>Carregando tarefas...</p>
    </div>

    <!-- Empty state -->
    <div
      class="empty-state"
      v-else-if="!isLoading && (tasks ?? []).length === 0"
    >
      <p class="empty-icon">
        📋
      </p>
      <h2>Nenhuma tarefa encontrada</h2>
      <p>Conecte-se ao servidor para visualizar suas tarefas.</p>
    </div>

    <!-- Task grid -->
    <TaskGrid v-else :tasks="tasks ?? []" />
  </DashboardLayout>
</template>

<script setup lang="ts">
import type { Task } from '../../types';
import DashboardLayout from './DashboardLayout.vue';
import TaskGrid from './TaskGrid.vue';

export interface DashboardProps {
  title?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
  statusText?: string;
  errorMessage?: string;
  showRetry?: boolean;
  isRetrying?: boolean;
  isLoading?: boolean;
  tasks?: Task[];
}

withDefaults(defineProps<DashboardProps>(), {
  title: 'Dashboard',
  connectionStatus: 'disconnected',
  statusText: 'Desconectado',
  errorMessage: '',
  showRetry: false,
  isRetrying: false,
  isLoading: false,
});

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
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
