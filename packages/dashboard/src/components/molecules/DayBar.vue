<script setup lang="ts">
import { computed } from 'vue';
import type { DayProgress } from '../../types';

export interface Props {
  day: DayProgress;
  maxHours?: number;
  variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  maxHours: 8,
  variant: 'default',
});

const formatDate = (date: Date | string): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayDate = new Date(date);

  if (dayDate.toDateString() === today.toDateString()) {
    return 'Hoje';
  }
  if (dayDate.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }

  return dayDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: undefined,
  });
};

const percentage = computed(() => {
  return Math.min((props.day.hours / props.maxHours) * 100, 100);
});

const getVariant = computed(() => {
  const ratio = props.day.hours / props.maxHours;
  if (ratio >= 1) return 'success';
  if (ratio >= 0.75) return 'primary';
  if (ratio >= 0.5) return 'warning';
  return 'danger';
});
</script>

<template>
  <div class="day-bar" :class="`day-bar--${variant}`">
    <div class="day-bar__header">
      <span class="day-bar__date">{{ formatDate(day.date) }}</span>
      <span class="day-bar__hours">{{ day.hours }}h</span>
    </div>

    <div class="day-bar__progress">
      <div
        class="day-bar__fill"
        :class="`day-bar__fill--${getVariant}`"
        :style="{ width: `${percentage}%` }"
      />
    </div>

    <p
      class="day-bar__description"
      v-if="variant === 'default' && day.description"
    >
      {{ day.description }}
    </p>
  </div>
</template>

<style scoped>
.day-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.day-bar--compact {
  gap: 0.25rem;
}

.day-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.day-bar--compact .day-bar__header {
  font-size: 0.75rem;
}

.day-bar__date {
  color: var(--color-text-secondary, #666);
  font-weight: 500;
}

.day-bar__hours {
  color: var(--color-text-primary, #1a1a1a);
  font-weight: 600;
}

.day-bar__progress {
  height: 8px;
  background: var(--color-bg-secondary, #e5e7eb);
  border-radius: 4px;
  overflow: hidden;
}

.day-bar--compact .day-bar__progress {
  height: 4px;
}

.day-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.day-bar__fill--success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.day-bar__fill--primary {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.day-bar__fill--warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.day-bar__fill--danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.day-bar__description {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-tertiary, #999);
  line-height: 1.4;
}
</style>
