<template>
  <span :class="['badge', `badge--${variant}`]" :style="badgeStyle">
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
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  transition: all 0.2s;
}

.badge--default {
  background-color: #e5e7eb;
  color: #374151;
}

.badge--primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.badge--success {
  background-color: #10b981;
  color: #ffffff;
}

.badge--warning {
  background-color: #f59e0b;
  color: #ffffff;
}

.badge--danger {
  background-color: #ef4444;
  color: #ffffff;
}

.badge--info {
  background-color: #06b6d4;
  color: #ffffff;
}
</style>
