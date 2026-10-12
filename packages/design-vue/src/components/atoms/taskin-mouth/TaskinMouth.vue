<template>
  <path
    id="mouth"
    :class="{ 'mouth-speaking': speakingStyle !== undefined }"
    :style="speakingStyle"
    :d="mouthPath"
    :transform="mouthTransform(props.variant)"
    :fill="mouthFill(props.expression)"
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
import { FILLED_MOUTHS, MOUTH_INK, MOUTH_PATHS, type MouthExpression, mouthTransform } from './TaskinMouth.types';

export interface Props {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
  variant?: TaskinVariant;
  speaking?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expression: 'neutral',
  animationsEnabled: true,
  variant: 'taskin',
  speaking: false,
});

const mouthPath = computed(() => MOUTH_PATHS[props.expression] ?? MOUTH_PATHS.neutral);

const mouthFill = (expression: MouthExpression) =>
  FILLED_MOUTHS.includes(expression) ? MOUTH_INK[props.variant] : 'none';

/**
 * A fala anima o `d` pelo CSS, como o tentaculo: os dois caminhos entram como
 * variaveis e a animacao so troca entre eles. Sem animacao, nada entra, e a
 * boca fica na expressao.
 */
const speakingStyle = computed(() =>
  props.speaking && props.animationsEnabled
    ? {
        '--mouth-rest': `path("${mouthPath.value}")`,
        '--mouth-rest-fill': mouthFill(props.expression),
        '--mouth-open': `path("${MOUTH_PATHS.open}")`,
        '--mouth-open-fill': MOUTH_INK[props.variant],
      }
    : undefined,
);
</script>

<script lang="ts">
export default {
  name: 'TaskinMouth',
};
</script>

<style scoped>
/* Uma silaba a cada ~170ms: fecha na expressao, abre, e volta. */
.mouth-speaking {
  animation: mouth-speak 0.17s step-end infinite;
}

@keyframes mouth-speak {
  0%,
  100% {
    d: var(--mouth-rest);
    fill: var(--mouth-rest-fill);
  }
  50% {
    d: var(--mouth-open);
    fill: var(--mouth-open-fill);
  }
}

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
