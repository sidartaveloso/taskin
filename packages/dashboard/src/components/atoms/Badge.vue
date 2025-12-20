<template>
  <span
    :class="['badge', `badge--${variant}`]"
    :style="badgeStyle"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
  size: 'md',
});

const badgeStyle = computed(() => {
  const sizeMap = {
    sm: '0.75rem',
    md: '0.875rem',
    lg: '1rem',
  };
  return {
    fontSize: sizeMap[props.size],
  };
});
</script>

<style scoped>
@import '../../styles/variables.css';

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--badge-padding-y) var(--badge-padding-x);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  white-space: nowrap;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.badge--default {
  background-color: var(--bg-badge);
  color: var(--text-primary);
}

.badge--primary {
  background-color: var(--status-progress-bg);
  color: var(--status-progress-text);
}

.badge--success {
  background-color: var(--status-success-bg);
  color: var(--status-success-text);
}

.badge--warning {
  background-color: var(--status-paused-bg);
  color: var(--status-paused-text);
}

.badge--danger {
  background-color: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.badge--info {
  background-color: var(--bg-header);
  color: var(--text-white);
}
</style>
