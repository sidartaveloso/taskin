<script setup lang="ts">
import type { User } from '../../types';
import Avatar from '../atoms/Avatar.vue';

export interface Props {
  assignee: User
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  size: 'md'
})
</script>

<template>
  <div class="task-header" :class="`task-header--${size}`">
    <Avatar
      :name="assignee.name"
      :src="assignee.avatar"
      :size="size"
    />
    <div class="task-header__info">
      <span class="task-header__name">{{ assignee.name }}</span>
      <span v-if="assignee.email" class="task-header__email">{{ assignee.email }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.task-header__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.task-header__name {
  font-weight: 500;
  color: var(--color-text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-header__email {
  font-size: 0.875em;
  color: var(--color-text-secondary, #666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Size variants */
.task-header--sm .task-header__name {
  font-size: 0.875rem;
}

.task-header--sm .task-header__email {
  font-size: 0.75rem;
}

.task-header--md .task-header__name {
  font-size: 1rem;
}

.task-header--md .task-header__email {
  font-size: 0.875rem;
}

.task-header--lg .task-header__name {
  font-size: 1.125rem;
}

.task-header--lg .task-header__email {
  font-size: 1rem;
}
</style>
