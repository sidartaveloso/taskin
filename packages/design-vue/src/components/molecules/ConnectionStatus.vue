<template>
  <div class="connection-status" role="status">
    <span class="status-indicator" :class="`status-indicator--${status}`" />
    <span class="status-text">{{ statusText }}</span>

    <button
      class="retry-button"
      v-if="showRetry"
      type="button"
      :disabled="isRetrying"
      @click="$emit('retry')"
    >
      {{ isRetrying ? retryingText : retryText }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * O estado da conexao com o servidor: o ponto colorido, o texto e, quando ha
 * erro, o botao de tentar de novo.
 *
 * Saiu de dentro do `DashboardHeader` para poder ficar num lugar comum a mais
 * de uma tela — a conexao e uma so, e a tela de priorizacao depende dela tanto
 * quanto o quadro (task-128).
 */
export interface ConnectionStatusProps {
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  statusText?: string;
  showRetry?: boolean;
  isRetrying?: boolean;
  retryText?: string;
  retryingText?: string;
}

withDefaults(defineProps<ConnectionStatusProps>(), {
  status: 'disconnected',
  statusText: 'Desconectado',
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
.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
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

@media (prefers-reduced-motion: reduce) {
  .status-indicator {
    animation: none;
  }
}

.status-text {
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-muted, #495057);
  font-family: var(--font-family);
}

.retry-button {
  padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 0.75rem);
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
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
