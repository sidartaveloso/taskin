<template>
  <path
    id="mouth"
    :d="mouthPath"
    fill="none"
    stroke="#2C3E50"
    stroke-width="3"
    stroke-linecap="round"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MouthExpression } from './taskin-mouth.types';

export interface Props {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expression: 'neutral',
  animationsEnabled: true,
});

const mouthPath = computed(() => {
  switch (props.expression) {
    case 'smile':
      return 'M145 125 Q160 133 175 125';
    case 'frown':
      return 'M145 125 Q160 118 175 125';
    case 'open':
      return 'M145 125 Q160 135 175 125';
    case 'neutral':
    default:
      return 'M145 125 Q160 130 175 125';
  }
});
</script>

<script lang="ts">
export default {
  name: 'TaskinMouth',
};
</script>
