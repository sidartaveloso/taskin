<template>
  <header class="dashboard-header">
    <div class="header-content">
      <h1 class="header-title">
        {{ title }}
      </h1>

      <div class="connection-status">
        <span class="status-indicator" :class="`status-indicator--${status}`" />
        <span class="status-text">{{ statusText }}</span>

        <button
          class="retry-button"
          v-if="showRetry"
          :disabled="isRetrying"
          @click="$emit('retry')"
        >
          {{ isRetrying ? retryingText : retryText }}
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div class="error-banner" v-if="errorMessage">
      <span class="error-icon">⚠️</span>
      <span class="error-message">{{ errorMessage }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
export interface DashboardHeaderProps {
  title?: string;
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  statusText?: string;
  errorMessage?: string;
  showRetry?: boolean;
  isRetrying?: boolean;
  retryText?: string;
  retryingText?: string;
}

withDefaults(defineProps<DashboardHeaderProps>(), {
  title: 'Dashboard',
  status: 'disconnected',
  statusText: 'Desconectado',
  errorMessage: '',
  showRetry: false,
  isRetrying: false,
  retryText: 'Tentar novamente',
  retryingText: 'Reconectando...',
});

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
.dashboard-header {
  background: var(--bg-card, white);
  border-bottom: 1px solid var(--border-muted, #e5e5e5);
  box-shadow: 0 1px 3px var(--shadow-base, rgba(0, 0, 0, 0.1));
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 200);
}

.header-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: var(--spacing-lg, 1rem) var(--spacing-xl, 1.5rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xl, 2rem);
  flex-wrap: wrap;
}

.header-title {
  margin: 0;
  font-size: var(--font-size-xl, 1.5rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-primary, #212529);
  font-family: var(--font-family);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 0.75rem);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full, 50%);
  animation: pulse 2s ease-in-out infinite;
}

.status-indicator--connected {
  background-color: var(--status-success-bg, #10b981);
}

.status-indicator--disconnected,
.status-indicator--connecting {
  background-color: var(--text-warning, #f59e0b);
}

.status-indicator--error {
  background-color: var(--status-warning-bg, #ef4444);
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
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-muted, #495057);
  font-family: var(--font-family);
}

.retry-button {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1rem);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--status-progress-text, white);
  background: var(--status-progress-bg, #169bd7);
  border: none;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s);
  font-family: var(--font-family);
}

.retry-button:hover:not(:disabled) {
  background: var(--bg-header, #0d7eb9);
  transform: translateY(-1px);
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background: var(--bg-section-error, #fff5f5);
  border-top: 1px solid var(--status-warning-bg, #feb2b2);
  padding: var(--spacing-md, 0.75rem) var(--spacing-xl, 1.5rem);
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 0.75rem);
  max-width: 1920px;
  margin: 0 auto;
}

.error-icon {
  font-size: var(--font-size-lg, 1.25rem);
}

.error-message {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-error-dark, #c92a2a);
  font-family: var(--font-family);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md, 1rem);
  }

  .connection-status {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
