<template>
  <div :class="['avatar', `avatar--${size}`]" :title="name">
    <img class="avatar__image" v-if="src" :src="src" :alt="name" />
    <span class="avatar__initials" v-else>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AvatarProps } from './Avatar.types';

const props = withDefaults(defineProps<AvatarProps>(), {
  size: 'md',
  src: undefined,
});

const initials = computed(() => {
  const parts = props.name.trim().split(' ');
  const first = parts.at(0);
  const last = parts.at(-1);
  if (parts.length >= 2 && first && last) {
    // `charAt` devolve '' em vez de undefined para o nome vazio
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
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
