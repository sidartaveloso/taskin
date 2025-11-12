<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '../../types';
import TaskCard from '../organisms/TaskCard.vue';

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
    inProgress: props.tasks.filter(t => t.status === 'in-progress'),
    blocked: props.tasks.filter(t => t.status === 'blocked'),
    paused: props.tasks.filter(t => t.status === 'paused'),
    pending: props.tasks.filter(t => t.status === 'pending'),
    done: props.tasks.filter(t => t.status === 'done'),
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
        <slot name="title">Tarefas em Andamento</slot>
      </h2>

      <div class="task-grid-stats">
        <div class="stat stat--total">
          <span class="stat__value">{{ statusCounts.total }}</span>
          <span class="stat__label">Total</span>
        </div>
        <div v-if="statusCounts.inProgress > 0" class="stat stat--in-progress">
          <span class="stat__value">{{ statusCounts.inProgress }}</span>
          <span class="stat__label">Em Progresso</span>
        </div>
        <div v-if="statusCounts.blocked > 0" class="stat stat--blocked">
          <span class="stat__value">{{ statusCounts.blocked }}</span>
          <span class="stat__label">Bloqueadas</span>
        </div>
        <div v-if="statusCounts.paused > 0" class="stat stat--paused">
          <span class="stat__value">{{ statusCounts.paused }}</span>
          <span class="stat__label">Pausadas</span>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="task-grid-loading">
      <div class="spinner"></div>
      <p>Carregando tarefas...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="tasks.length === 0" class="task-grid-empty">
      <div class="empty-icon">📋</div>
      <p class="empty-message">{{ emptyMessage }}</p>
      <slot name="empty-action"></slot>
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
    <div v-if="$slots.footer" class="task-grid-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.task-grid-container {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 1.5rem;
}

/* Header */
.task-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.task-grid-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

/* Stats */
.task-grid-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  background: #f5f5f5;
  min-width: 80px;
}

.stat__value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.stat__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat--total {
  background: #e3f2fd;
}

.stat--total .stat__value {
  color: #1976d2;
}

.stat--in-progress {
  background: #e8f5e9;
}

.stat--in-progress .stat__value {
  color: #4caf50;
}

.stat--blocked {
  background: #ffebee;
}

.stat--blocked .stat__value {
  color: #f44336;
}

.stat--paused {
  background: #fff3e0;
}

.stat--paused .stat__value {
  color: #ff9800;
}

/* Grid */
.task-grid {
  display: grid;
  gap: var(--grid-gap);
  width: 100%;
}

/* Gap variants */
.task-grid--gap-sm {
  --grid-gap: 1rem;
}

.task-grid--gap-md {
  --grid-gap: 1.5rem;
}

.task-grid--gap-lg {
  --grid-gap: 2rem;
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
    padding: 1rem;
  }

  .task-grid-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .task-grid-title {
    font-size: 1.5rem;
  }

  .task-grid-stats {
    width: 100%;
    justify-content: space-between;
  }

  .stat {
    flex: 1;
    min-width: 70px;
    padding: 0.5rem 0.75rem;
  }

  .stat__value {
    font-size: 1.5rem;
  }

  .stat__label {
    font-size: 0.65rem;
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
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.task-grid-loading p {
  font-size: 1rem;
  margin: 0;
}

/* Empty state */
.task-grid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-message {
  font-size: 1.125rem;
  color: #666;
  margin: 0 0 1.5rem;
}

/* Footer */
.task-grid-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

/* TV Display optimization (for large screens) */
@media (min-width: 1920px) {
  .task-grid-container {
    padding: 2rem;
  }

  .task-grid-header {
    margin-bottom: 2.5rem;
  }

  .task-grid-title {
    font-size: 2.5rem;
  }

  .stat {
    padding: 1rem 1.5rem;
    min-width: 100px;
  }

  .stat__value {
    font-size: 2rem;
  }

  .stat__label {
    font-size: 0.875rem;
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
