<template>
  <div class="dashboard-layout">
    <DashboardHeader
      :title="title"
      :status="connectionStatus"
      :status-text="statusText"
      :error-message="errorMessage"
      :show-retry="showRetry"
      :is-retrying="isRetrying"
      @retry="$emit('retry')"
    />

    <main class="dashboard-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import DashboardHeader from '../organisms/DashboardHeader.vue';

export interface DashboardLayoutProps {
  title?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
  statusText?: string;
  errorMessage?: string;
  showRetry?: boolean;
  isRetrying?: boolean;
}

withDefaults(defineProps<DashboardLayoutProps>(), {
  title: 'Dashboard',
  connectionStatus: 'disconnected',
  statusText: 'Desconectado',
  errorMessage: '',
  showRetry: false,
  isRetrying: false,
});

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-body, #f5f5f5);
  font-family: var(--font-family, 'Ubuntu', system-ui, sans-serif);
  overflow: hidden;
}

.dashboard-main {
  flex: 1;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.5rem);
  overflow-y: auto;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: var(--spacing-lg, 1rem);
  }
}
</style>
