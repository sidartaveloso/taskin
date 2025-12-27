<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '../../types';
import { TaskCard } from '../organisms';

interface Props {
  tasks: Task[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
  gap: 'md',
  loading: false,
  emptyMessage: 'Nenhuma tarefa encontrada',
  variant: 'default',
});

// Grid classes based on columns
const gridClasses = computed(() => {
  const colClasses = {
    1: 'task-grid--cols-1',
    2: 'task-grid--cols-2',
    3: 'task-grid--cols-3',
    4: 'task-grid--cols-4',
  };

  return [
    'task-grid',
    colClasses[props.columns],
    `task-grid--gap-${props.gap}`,
  ];
});

// Separate tasks by status for better organization
const tasksByStatus = computed(() => {
  return {
    inProgress: props.tasks.filter((t) => t.status === 'in-progress'),
    blocked: props.tasks.filter((t) => t.status === 'blocked'),
    paused: props.tasks.filter((t) => t.status === 'paused'),
    pending: props.tasks.filter((t) => t.status === 'pending'),
    done: props.tasks.filter((t) => t.status === 'done'),
  };
});

// Count tasks by status
const statusCounts = computed(() => ({
  total: props.tasks.length,
  inProgress: tasksByStatus.value.inProgress.length,
  blocked: tasksByStatus.value.blocked.length,
  paused: tasksByStatus.value.paused.length,
  pending: tasksByStatus.value.pending.length,
  done: tasksByStatus.value.done.length,
}));
</script>

<template>
  <div class="task-grid-container">
    <!-- Header with stats -->
    <div class="task-grid-header">
      <h2 class="task-grid-title">
        <slot name="title">
          Tarefas em Andamento
        </slot>
      </h2>

      <div class="task-grid-stats">
        <div class="stat stat--total">
          <span class="stat__value">{{ statusCounts.total }}</span>
          <span class="stat__label">Total</span>
        </div>
        <div class="stat stat--in-progress" v-if="statusCounts.inProgress > 0">
          <span class="stat__value">{{ statusCounts.inProgress }}</span>
          <span class="stat__label">Em Progresso</span>
        </div>
        <div class="stat stat--blocked" v-if="statusCounts.blocked > 0">
          <span class="stat__value">{{ statusCounts.blocked }}</span>
          <span class="stat__label">Bloqueadas</span>
        </div>
        <div class="stat stat--paused" v-if="statusCounts.paused > 0">
          <span class="stat__value">{{ statusCounts.paused }}</span>
          <span class="stat__label">Pausadas</span>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div class="task-grid-loading" v-if="loading">
      <div class="spinner" />
      <p>Carregando tarefas...</p>
    </div>

    <!-- Empty state -->
    <div class="task-grid-empty" v-else-if="tasks.length === 0">
      <div class="empty-icon">
        📋
      </div>
      <p class="empty-message">
        {{ emptyMessage }}
      </p>
      <slot name="empty-action" />
    </div>

    <!-- Task grid -->
    <div v-else :class="gridClasses">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :variant="variant"
      />
    </div>

    <!-- Footer slot -->
    <div class="task-grid-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
@import '../../styles/variables.css';

.task-grid-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: var(--container-padding);
  background: var(--bg-body);
  font-family: var(--font-family);
  box-sizing: border-box;
}

/* Header */
.task-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.task-grid-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

/* Stats */
.task-grid-stats {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  min-width: 80px;
  box-shadow: var(--shadow-card);
}

.stat__value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.stat__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat--total {
  background: var(--bg-section-light);
}

.stat--total .stat__value {
  color: var(--text-header-link);
}

.stat--in-progress {
  background: var(--bg-section-light);
}

.stat--in-progress .stat__value {
  color: var(--status-progress-bg);
}

.stat--blocked {
  background: var(--bg-section-error);
}

.stat--blocked .stat__value {
  color: var(--status-warning-text);
}

.stat--paused {
  background: var(--bg-section-warning);
}

.stat--paused .stat__value {
  color: var(--status-paused-bg);
}

/* Grid */
.task-grid {
  display: grid;
  gap: var(--grid-gap);
  width: 100%;
}

/* Gap variants */
.task-grid--gap-sm {
  --grid-gap: var(--spacing-md);
}

.task-grid--gap-md {
  --grid-gap: var(--grid-gap-horizontal);
}

.task-grid--gap-lg {
  --grid-gap: var(--spacing-xl);
}

/* Column variants - Desktop first */
.task-grid--cols-1 {
  grid-template-columns: 1fr;
}

.task-grid--cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.task-grid--cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.task-grid--cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive breakpoints */
@media (max-width: 1400px) {
  .task-grid--cols-4 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .task-grid--cols-3,
  .task-grid--cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .task-grid-container {
    padding: var(--spacing-md);
  }

  .task-grid-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: var(--spacing-xl);
  }

  .task-grid-title {
    font-size: var(--font-size-xl);
  }

  .task-grid-stats {
    width: 100%;
    justify-content: space-between;
  }

  .stat {
    flex: 1;
    min-width: 70px;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .stat__value {
    font-size: var(--font-size-xl);
  }

  .stat__label {
    font-size: var(--font-size-xs);
  }

  .task-grid--cols-2,
  .task-grid--cols-3,
  .task-grid--cols-4 {
    grid-template-columns: 1fr;
  }
}

/* Loading state */
.task-grid-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  color: var(--text-muted);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-progress);
  border-top: 4px solid var(--status-progress-bg);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.task-grid-loading p {
  font-size: var(--font-size-md);
  margin: 0;
}

/* Empty state */
.task-grid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
}

.empty-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-message {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  margin: 0 0 var(--spacing-xl);
}

/* Footer */
.task-grid-footer {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--border-muted);
}

/* TV Display optimization (for large screens) */
@media (min-width: 1920px) {
  .task-grid-container {
    padding: var(--spacing-2xl);
  }

  .task-grid-header {
    margin-bottom: var(--spacing-3xl);
  }

  .task-grid-title {
    font-size: var(--font-size-3xl);
  }

  .stat {
    padding: var(--spacing-lg) var(--spacing-xl);
    min-width: 100px;
  }

  .stat__value {
    font-size: var(--font-size-2xl);
  }

  .stat__label {
    font-size: var(--font-size-sm);
  }
}

/* Print styles */
@media print {
  .task-grid-container {
    padding: 0;
  }

  .task-grid-stats {
    display: none;
  }

  .task-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
</style>
