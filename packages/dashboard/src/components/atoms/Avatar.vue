<template>
  <div
    :class="['avatar', `avatar--${size}`]"
    :title="name"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="avatar__image"
    >
    <span
      v-else
      class="avatar__initials"
    >{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<AvatarProps>(), {
  size: 'md',
  src: undefined,
});

const initials = computed(() => {
  const parts = props.name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return props.name.slice(0, 2).toUpperCase();
});
</script>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 600;
  flex-shrink: 0;
}

.avatar--sm {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}

.avatar--md {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 0.875rem;
}

.avatar--lg {
  width: 3rem;
  height: 3rem;
  font-size: 1rem;
}

.avatar--xl {
  width: 4rem;
  height: 4rem;
  font-size: 1.25rem;
}

.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__initials {
  user-select: none;
}
</style>
