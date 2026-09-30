<template>
  <path
    id="mouth"
    :d="mouthPath"
    :transform="mouthTransform(props.variant)"
    :fill="
      ['open', 'wide-open', 'o-shape', 'surprised', 'panting'].includes(props.expression)
        ? MOUTH_INK[props.variant]
        : 'none'
    "
    :stroke="MOUTH_INK[props.variant]"
    stroke-width="3"
    stroke-linecap="round"
  />
  <!--
    A lingua para fora do ofegante. Mora num grupo com o deslocamento da boca:
    a animacao mexe no `transform` do path, e sobrescreveria o do Sapin.
  -->
  <g v-if="props.expression === 'panting'" id="mouth-tongue" :transform="mouthTransform(props.variant)">
    <path
      :class="{ 'tongue-pant': props.animationsEnabled }"
      d="M151 132 L151 143 Q151 152 160 152 Q169 152 169 143 L169 132 M160 135 L160 145"
      fill="#FF9EB5"
      :stroke="MOUTH_INK[props.variant]"
      stroke-width="2"
      stroke-linecap="round"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';
import { MOUTH_INK, type MouthExpression, mouthTransform } from './TaskinMouth.types';

export interface Props {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
  variant?: TaskinVariant;
}

const props = withDefaults(defineProps<Props>(), {
  expression: 'neutral',
  animationsEnabled: true,
  variant: 'taskin',
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
    case 'panting':
      // Ofegante: aberta e redonda, com os cantos caidos — nao o sorriso
      // escancarado do `wide-open`, que no calor parecia contentamento.
      return 'M143 124 Q160 112 177 124 Q176 139 160 140 Q144 139 143 124 Z';
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

<style scoped>
.tongue-pant {
  animation: tongue-pant 0.4s ease-in-out infinite;
}

@keyframes tongue-pant {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(1.5px);
  }
}
</style>
