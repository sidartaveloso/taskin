<script setup lang="ts">
import { computed } from 'vue';
import type {
  ProjectPath,
  Task,
  TaskProgress,
  TaskStatus,
  TimeEstimate as TimeEstimateType,
  User,
} from '../../types';
import Badge from '../atoms/Badge.vue';
import ProgressBar from '../atoms/ProgressBar.vue';
import DayBar from '../molecules/DayBar.vue';
import ProjectBreadcrumb from '../molecules/ProjectBreadcrumb.vue';
import TaskHeader from '../molecules/TaskHeader.vue';
import TimeEstimate from '../molecules/TimeEstimate.vue';

interface Props {
  // Hybrid approach: accept full Task object OR individual props
  task?: Task;

  // Individual props (for Storybook flexibility)
  id?: string;
  number?: number;
  title?: string;
  status?: TaskStatus;
  assignee?: User;
  project?: ProjectPath;
  estimates?: TimeEstimateType;
  progress?: TaskProgress;
  tags?: string[];
  warnings?: string[];
  dueDate?: Date | string;
  startDate?: Date | string;

  // Control props (always individual)
  variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

// Merge task object with individual props
const computedTask = computed((): Task => {
  // If task object is provided, use it as base
  if (props.task) {
    return {
      ...props.task,
      // Individual props override task object if provided
      ...(props.id && { id: props.id }),
      ...(props.number !== undefined && { number: props.number }),
      ...(props.title && { title: props.title }),
      ...(props.status && { status: props.status }),
      ...(props.assignee && { assignee: props.assignee }),
      ...(props.project && { project: props.project }),
      ...(props.estimates && { estimates: props.estimates }),
      ...(props.progress && { progress: props.progress }),
      ...(props.tags && { tags: props.tags }),
      ...(props.warnings && { warnings: props.warnings }),
    };
  }

  // Build task from individual props
  return {
    id: props.id || '',
    number: props.number || 0,
    title: props.title || '',
    status: props.status || 'pending',
    assignee: props.assignee!,
    project: props.project || { segments: [] },
    estimates: props.estimates,
    progress: props.progress,
    tags: props.tags || [],
    warnings: props.warnings || [],
    dates: {
      created: new Date(),
      ...(props.dueDate && {
        dueDate:
          typeof props.dueDate === 'string'
            ? new Date(props.dueDate)
            : props.dueDate,
      }),
      ...(props.startDate && {
        started:
          typeof props.startDate === 'string'
            ? new Date(props.startDate)
            : props.startDate,
      }),
    },
  };
});

// Status badge variant mapping
const statusVariantMap: Record<
  TaskStatus,
  'default' | 'primary' | 'warning' | 'success' | 'danger'
> = {
  pending: 'default',
  'in-progress': 'primary',
  paused: 'warning',
  done: 'success',
  blocked: 'danger',
};

// Progress bar variant based on status
const progressVariant = computed(() => {
  const progress = computedTask.value.progress?.percentage || 0;

  if (computedTask.value.status === 'blocked') return 'danger';
  if (computedTask.value.status === 'done') return 'success';
  if (progress >= 75) return 'success';
  if (progress >= 50) return 'primary';
  if (progress >= 25) return 'warning';
  return 'danger';
});

// Status label
const statusLabel = computed(() => {
  const labels: Record<TaskStatus, string> = {
    pending: 'Pendente',
    'in-progress': 'Em Progresso',
    paused: 'Pausada',
    done: 'Concluída',
    blocked: 'Bloqueada',
  };
  return labels[computedTask.value.status];
});

// Check if task has warnings
const hasWarnings = computed(
  () => computedTask.value.warnings && computedTask.value.warnings.length > 0,
);

// Format date
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
</script>

<template>
  <div
    class="task-card"
    :class="[
      `task-card--${variant}`,
      `task-card--${computedTask.status}`,
      { 'task-card--has-warnings': hasWarnings },
    ]"
  >
    <!-- Header -->
    <div class="task-card__header">
      <div class="task-card__header-left">
        <Badge :variant="statusVariantMap[computedTask.status]" size="md">
          #{{ computedTask.number }}
        </Badge>
        <Badge variant="info" size="sm">
          {{ statusLabel }}
        </Badge>
      </div>

      <TaskHeader
        v-if="computedTask.assignee"
        :assignee="computedTask.assignee"
        size="sm"
      />
    </div>

    <!-- Title -->
    <h3 class="task-card__title">
      {{ computedTask.title }}
    </h3>

    <!-- Project Path -->
    <ProjectBreadcrumb
      class="task-card__project"
      v-if="computedTask.project"
      :project="computedTask.project"
      :max-segments="3"
    />

    <!-- Progress -->
    <div class="task-card__progress" v-if="computedTask.progress">
      <ProgressBar
        :percentage="computedTask.progress.percentage"
        :variant="progressVariant"
        show-label
      />
    </div>

    <!-- Time Estimates -->
    <TimeEstimate
      class="task-card__estimates"
      v-if="computedTask.estimates"
      :estimate="computedTask.estimates"
      variant="compact"
    />

    <!-- Daily Progress -->
    <div
      class="task-card__days"
      v-if="
        computedTask.progress?.dayLogs &&
        computedTask.progress.dayLogs.length > 0
      "
    >
      <h4 class="task-card__days-title">Progresso Diário</h4>
      <div class="task-card__days-list">
        <DayBar
          v-for="(day, index) in computedTask.progress.dayLogs.slice(-3)"
          :key="index"
          :day="day"
          :max-hours="8"
          variant="compact"
        />
      </div>
    </div>

    <!-- Dates -->
    <div class="task-card__dates" v-if="computedTask.dates">
      <div class="task-card__date" v-if="computedTask.dates.dueDate">
        <span class="task-card__date-label">Prazo:</span>
        <span class="task-card__date-value">{{
          formatDate(computedTask.dates.dueDate)
        }}</span>
      </div>
      <div class="task-card__date" v-if="computedTask.dates.started">
        <span class="task-card__date-label">Início:</span>
        <span class="task-card__date-value">{{
          formatDate(computedTask.dates.started)
        }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div
      class="task-card__tags"
      v-if="computedTask.tags && computedTask.tags.length > 0"
    >
      <Badge
        v-for="tag in computedTask.tags"
        :key="tag"
        variant="default"
        size="sm"
      >
        {{ tag }}
      </Badge>
    </div>

    <!-- Warnings -->
    <div class="task-card__warnings" v-if="hasWarnings">
      <div
        class="task-card__warning"
        v-for="(warning, index) in computedTask.warnings"
        :key="index"
      >
        ⚠️ {{ warning }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../../styles/variables.css';

.task-card {
  background: var(--bg-card);
  border: 3px solid var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-card);
  font-family: var(--font-family);
  position: relative;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow:
    var(--shadow-card),
    0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Status variants */
.task-card--in-progress {
  border-color: var(--status-progress-bg);
}

.task-card--blocked {
  border-color: var(--status-warning-bg);
  background: var(--bg-section-error);
}

.task-card--done {
  border-color: var(--status-success-bg);
  opacity: 0.85;
}

.task-card--paused {
  border-color: var(--status-paused-bg);
}

/* Warning state */
.task-card--has-warnings {
  border-color: var(--status-warning-bg);
  box-shadow:
    var(--shadow-card),
    0 0 0 3px var(--status-warning-bg);
}

/* Header */
.task-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.task-card__header-left {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

/* Title */
.task-card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Project */
.task-card__project {
  opacity: 0.8;
}

/* Progress */
.task-card__progress {
  margin: var(--spacing-sm) 0;
}

/* Estimates */
.task-card__estimates {
  padding: var(--spacing-md);
  background: var(--bg-section-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-section-light);
}

/* Daily Progress */
.task-card__days {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-card__days-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  margin: 0;
}

.task-card__days-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* Dates */
.task-card__dates {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding: var(--spacing-md);
  background: var(--bg-section-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.task-card__date {
  display: flex;
  gap: var(--spacing-sm);
}

.task-card__date-label {
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.task-card__date-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Tags */
.task-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

/* Warnings */
.task-card__warnings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-section-warning);
  border: 2px solid var(--status-warning-bg);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-section-warning);
}

.task-card__warning {
  font-size: var(--font-size-sm);
  color: var(--text-warning-dark);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Compact variant */
.task-card--compact {
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
}

.task-card--compact .task-card__title {
  font-size: var(--font-size-md);
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.task-card--compact .task-card__days {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .task-card {
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }

  .task-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-card__title {
    font-size: var(--font-size-md);
  }
}
</style>
