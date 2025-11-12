<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectPath, Task, TaskProgress, TaskStatus, TimeEstimate as TimeEstimateType, User } from '../../types';
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
      ...(props.dueDate && { dueDate: typeof props.dueDate === 'string' ? new Date(props.dueDate) : props.dueDate }),
      ...(props.startDate && { started: typeof props.startDate === 'string' ? new Date(props.startDate) : props.startDate }),
    },
  };
});

// Status badge variant mapping
const statusVariantMap: Record<TaskStatus, any> = {
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
const hasWarnings = computed(() => computedTask.value.warnings && computedTask.value.warnings.length > 0);

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
      { 'task-card--has-warnings': hasWarnings }
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

      <TaskHeader :assignee="computedTask.assignee" size="sm" />
    </div>

    <!-- Title -->
    <h3 class="task-card__title">{{ computedTask.title }}</h3>

    <!-- Project Path -->
    <ProjectBreadcrumb
      v-if="computedTask.project"
      :project="computedTask.project"
      :max-segments="3"
      class="task-card__project"
    />

    <!-- Progress -->
    <div v-if="computedTask.progress" class="task-card__progress">
      <ProgressBar
        :percentage="computedTask.progress.percentage"
        :variant="progressVariant"
        show-label
      />
    </div>

    <!-- Time Estimates -->
    <TimeEstimate
      v-if="computedTask.estimates"
      :estimate="computedTask.estimates"
      variant="compact"
      class="task-card__estimates"
    />

    <!-- Daily Progress -->
    <div v-if="computedTask.progress?.dayLogs && computedTask.progress.dayLogs.length > 0" class="task-card__days">
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
    <div v-if="computedTask.dates" class="task-card__dates">
      <div v-if="computedTask.dates.dueDate" class="task-card__date">
        <span class="task-card__date-label">Prazo:</span>
        <span class="task-card__date-value">{{ formatDate(computedTask.dates.dueDate) }}</span>
      </div>
      <div v-if="computedTask.dates.started" class="task-card__date">
        <span class="task-card__date-label">Início:</span>
        <span class="task-card__date-value">{{ formatDate(computedTask.dates.started) }}</span>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="computedTask.tags && computedTask.tags.length > 0" class="task-card__tags">
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
    <div v-if="hasWarnings" class="task-card__warnings">
      <div
        v-for="(warning, index) in computedTask.warnings"
        :key="index"
        class="task-card__warning"
      >
        ⚠️ {{ warning }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Status variants */
.task-card--in-progress {
  border-color: #1a73e8;
}

.task-card--blocked {
  border-color: #d32f2f;
  background: #fff5f5;
}

.task-card--done {
  border-color: #2e7d32;
  opacity: 0.85;
}

.task-card--paused {
  border-color: #f57c00;
}

/* Warning state */
.task-card--has-warnings {
  border-color: #f57c00;
  box-shadow: 0 0 0 3px rgba(245, 124, 0, 0.1);
}

/* Header */
.task-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.task-card__header-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Title */
.task-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Project */
.task-card__project {
  opacity: 0.8;
}

/* Progress */
.task-card__progress {
  margin: 0.5rem 0;
}

/* Estimates */
.task-card__estimates {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
}

/* Daily Progress */
.task-card__days {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-card__days-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin: 0;
}

.task-card__days-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Dates */
.task-card__dates {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 6px;
  font-size: 0.875rem;
}

.task-card__date {
  display: flex;
  gap: 0.5rem;
}

.task-card__date-label {
  color: #666;
  font-weight: 500;
}

.task-card__date-value {
  color: #1a1a1a;
  font-weight: 600;
}

/* Tags */
.task-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Warnings */
.task-card__warnings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #f57c00;
  border-radius: 6px;
}

.task-card__warning {
  font-size: 0.875rem;
  color: #663c00;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Compact variant */
.task-card--compact {
  padding: 1rem;
  gap: 0.75rem;
}

.task-card--compact .task-card__title {
  font-size: 1rem;
  -webkit-line-clamp: 1;
}

.task-card--compact .task-card__days {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .task-card {
    padding: 1rem;
    gap: 0.75rem;
  }

  .task-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-card__title {
    font-size: 1rem;
  }
}
</style>
