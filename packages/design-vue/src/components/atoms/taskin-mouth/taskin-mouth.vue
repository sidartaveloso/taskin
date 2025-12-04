<template>
  <path
    id="mouth"
    :d="mouthPath"
    :fill="
      ['open', 'wide-open', 'o-shape', 'surprised'].includes(props.expression)
        ? '#2C3E50'
        : 'none'
    "
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
      // Forma oval pequena para boca aberta
      return 'M152 122 Q160 128 168 122 Q160 126 152 122 Z';
    case 'wide-open':
      // Boca totalmente escancarada (oval muito maior)
      return 'M140 115 Q160 145 180 115 Q160 142 140 115 Z';
    case 'o-shape':
      // Formato O (círculo perfeito pequeno)
      return 'M154 122 Q154 119 160 119 Q166 119 166 122 Q166 128 160 128 Q154 128 154 122 Z';
    case 'smirk':
      // Sorriso assimétrico de lado (mais alto à direita)
      return 'M145 127 Q155 130 165 127 Q170 124 175 122';
    case 'surprised':
      // Surpresa (O alongado vertical - maior que o-shape)
      return 'M155 118 Q152 118 152 125 Q152 132 155 132 Q165 132 165 125 Q165 118 155 118 Z';
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
