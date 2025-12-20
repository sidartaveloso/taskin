<template>
  <div class="progress-bar">
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :class="`progress-bar__fill--${variant}`"
        :style="{ width: `${percentage}%` }"
      >
        <span
          v-if="showLabel"
          class="progress-bar__label"
        >{{ percentage }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ProgressBarProps {
  percentage: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  variant: 'primary',
  showLabel: true,
});

// Clamp percentage between 0 and 100
const percentage = Math.min(100, Math.max(0, props.percentage));
</script>

<style scoped>
@import '../../styles/variables.css';

.progress-bar {
  width: 100%;
}

.progress-bar__track {
  width: 100%;
  height: var(--progress-height);
  background-color: var(--bg-progress);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width var(--transition-base);
  position: relative;
}

.progress-bar__fill--primary {
  background: var(--status-progress-bg);
}

.progress-bar__fill--success {
  background: var(--status-success-bg);
}

.progress-bar__fill--warning {
  background: var(--status-paused-bg);
}

.progress-bar__fill--danger {
  background: var(--status-warning-bg);
}

.progress-bar__label {
  color: var(--text-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
