<template>
  <header class="dashboard-header">
    <div class="header-content">
      <h1 class="header-title">
        {{ title }}
      </h1>

      <ConnectionStatus
        v-if="showConnection"
        :status="status"
        :status-text="statusText"
        :show-retry="showRetry"
        :is-retrying="isRetrying"
        :retry-text="retryText"
        :retrying-text="retryingText"
        @retry="$emit('retry')"
      />
    </div>

    <!-- Error message -->
    <div class="error-banner" v-if="showConnection && errorMessage">
      <span class="error-icon">⚠️</span>
      <span class="error-message">{{ errorMessage }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import ConnectionStatus from '../molecules/ConnectionStatus.vue';

export interface DashboardHeaderProps {
  title?: string;
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  statusText?: string;
  errorMessage?: string;
  showRetry?: boolean;
  isRetrying?: boolean;
  retryText?: string;
  retryingText?: string;
  /**
   * Mostra a conexao (o estado e a faixa de erro) no proprio cabecalho. O
   * dashboard desliga, porque a mostra na barra do topo, comum as duas telas.
   */
  showConnection?: boolean;
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
  showConnection: true,
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
}
</style>
