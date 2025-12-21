<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectPath } from '../../types';

export interface Props {
  project: ProjectPath;
  maxSegments?: number;
  separator?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxSegments: 3,
  separator: '/',
});

const displaySegments = computed(() => {
  if (props.project.segments.length <= props.maxSegments) {
    return props.project.segments;
  }

  return [
    props.project.segments[0],
    '...',
    ...props.project.segments.slice(-props.maxSegments + 1),
  ];
});
</script>

<template>
  <div class="project-breadcrumb">
    <span
      class="project-breadcrumb__item"
      v-for="(segment, index) in displaySegments"
      :key="`segment-${index}`"
    >
      <span
        class="project-breadcrumb__segment"
        :class="{ 'project-breadcrumb__segment--ellipsis': segment === '...' }"
      >
        {{ segment }}
      </span>
      <span
        class="project-breadcrumb__separator"
        v-if="index < displaySegments.length - 1"
      >
        {{ separator }}
      </span>
    </span>
  </div>
</template>

<style scoped>
.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #666);
  overflow: hidden;
}

.project-breadcrumb__segment {
  white-space: nowrap;
  transition: color 0.2s;
}

.project-breadcrumb__segment:last-child {
  color: var(--color-text-primary, #1a1a1a);
  font-weight: 500;
}

.project-breadcrumb__segment--ellipsis {
  color: var(--color-text-tertiary, #999);
  letter-spacing: 0.1em;
}

.project-breadcrumb__separator {
  color: var(--color-text-tertiary, #999);
  font-weight: 300;
  flex-shrink: 0;
}

/* Hover effect for non-ellipsis segments */
.project-breadcrumb__segment:not(.project-breadcrumb__segment--ellipsis):hover {
  color: var(--color-primary, #3b82f6);
  cursor: pointer;
}
</style>
