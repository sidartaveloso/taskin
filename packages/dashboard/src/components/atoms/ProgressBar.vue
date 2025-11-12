<template>
  <div class="progress-bar">
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :class="`progress-bar__fill--${variant}`"
        :style="{ width: `${percentage}%` }"
      >
        <span v-if="showLabel" class="progress-bar__label">{{ percentage }}%</span>
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
.progress-bar {
  width: 100%;
}

.progress-bar__track {
  width: 100%;
  height: 1.5rem;
  background-color: #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar__fill--primary {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.progress-bar__fill--success {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-bar__fill--warning {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.progress-bar__fill--danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.progress-bar__label {
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
