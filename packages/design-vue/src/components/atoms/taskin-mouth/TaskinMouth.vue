<template>
  <path
    id="mouth"
    :class="{ 'mouth-speaking': speakingStyle !== undefined }"
    :style="speakingStyle"
    :d="mouthPath"
    :transform="mouthTransform(props.offset)"
    :fill="mouthFill(props.expression)"
    :stroke="props.ink"
    stroke-width="3"
    stroke-linecap="round"
  />
  <!--
    A lingua para fora do ofegante. Mora num grupo com o deslocamento da boca:
    a animacao mexe no `transform` do path, e sobrescreveria o deslocamento.
  -->
  <g v-if="props.expression === 'panting'" id="mouth-tongue" :transform="mouthTransform(props.offset)">
    <path
      :class="{ 'tongue-pant': props.animationsEnabled }"
      d="M151 132 L151 143 Q151 152 160 152 Q169 152 169 143 L169 132 M160 135 L160 145"
      fill="#FF9EB5"
      :stroke="props.ink"
      stroke-width="2"
      stroke-linecap="round"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FILLED_MOUTHS, MOUTH_PATHS, type MouthExpression, mouthTransform, TASKIN_MOUTH } from './TaskinMouth.types';

export interface Props {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
  speaking?: boolean;
  /** How far the mouth sits from the reference drawing. Default: the octopus' (none). */
  offset?: { x: number; y: number };
  /** Colour of the lips and the open mouth. Default: the octopus' ink. */
  ink?: string;
}

const props = withDefaults(defineProps<Props>(), {
  expression: 'neutral',
  animationsEnabled: true,
  speaking: false,
  offset: () => TASKIN_MOUTH.offset,
  ink: TASKIN_MOUTH.ink,
});

const mouthPath = computed(() => MOUTH_PATHS[props.expression] ?? MOUTH_PATHS.neutral);

const mouthFill = (expression: MouthExpression) => (FILLED_MOUTHS.includes(expression) ? props.ink : 'none');

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
        '--mouth-open-fill': props.ink,
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
