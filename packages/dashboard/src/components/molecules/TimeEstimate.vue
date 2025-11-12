<script setup lang="ts">
import type { TimeEstimate as TimeEstimateType } from '../../types';

interface Props {
  estimate: TimeEstimateType
  variant?: 'default' | 'compact'
}

withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const formatHours = (hours: number): string => {
  return `${hours}h`
}

const getPercentage = (estimate: TimeEstimateType): number => {
  if (estimate.estimated === 0) return 0
  return Math.round((estimate.spent / estimate.estimated) * 100)
}

const getStatus = (estimate: TimeEstimateType): 'ok' | 'warning' | 'danger' => {
  const percentage = getPercentage(estimate)
  if (percentage >= 100) return 'danger'
  if (percentage >= 80) return 'warning'
  return 'ok'
}
</script>

<template>
  <div class="time-estimate" :class="[`time-estimate--${variant}`, `time-estimate--${getStatus(estimate)}`]">
    <div class="time-estimate__item">
      <span class="time-estimate__label">Estimado</span>
      <span class="time-estimate__value">{{ formatHours(estimate.estimated) }}</span>
    </div>

    <div class="time-estimate__separator" v-if="variant === 'default'">→</div>
    <div class="time-estimate__separator" v-else>/</div>

    <div class="time-estimate__item">
      <span class="time-estimate__label">Gasto</span>
      <span class="time-estimate__value time-estimate__value--spent">
        {{ formatHours(estimate.spent) }}
      </span>
    </div>

    <div class="time-estimate__separator" v-if="variant === 'default'">→</div>
    <div class="time-estimate__separator" v-else>/</div>

    <div class="time-estimate__item">
      <span class="time-estimate__label">Restante</span>
      <span class="time-estimate__value time-estimate__value--remaining">
        {{ formatHours(estimate.remaining) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.time-estimate {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.time-estimate--compact {
  gap: 0.5rem;
  font-size: 0.75rem;
}

.time-estimate__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.time-estimate--compact .time-estimate__item {
  flex-direction: row;
  gap: 0.375rem;
}

.time-estimate__label {
  font-size: 0.75em;
  color: var(--color-text-secondary, #666);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-estimate--compact .time-estimate__label {
  display: none;
}

.time-estimate__value {
  font-size: 1.25em;
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
}

.time-estimate__separator {
  color: var(--color-text-tertiary, #999);
  font-weight: 300;
  font-size: 1.1em;
}

/* Status-based coloring */
.time-estimate--ok .time-estimate__value--spent {
  color: var(--color-success, #10b981);
}

.time-estimate--warning .time-estimate__value--spent {
  color: var(--color-warning, #f59e0b);
}

.time-estimate--danger .time-estimate__value--spent {
  color: var(--color-danger, #ef4444);
}

.time-estimate--danger .time-estimate__value--remaining {
  color: var(--color-danger, #ef4444);
}
</style>
