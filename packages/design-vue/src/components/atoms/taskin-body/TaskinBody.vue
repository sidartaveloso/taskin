<template>
  <g id="body" :data-variant="variant">
    <template v-if="variant === 'sapin'">
      <!--
        O Sapin, medido na referencia (TASKS/assets/sapin/sapin-mascote.png).
        As coxas fazem parte da silhueta do sapo, por isso moram no corpo: vem
        atras, o corpo por cima, depois os calombos dos olhos, a barriga e, por
        ultimo, os pes.
      -->
      <g
        id="body-sapin"
        :class="{
          'body-float': animationsEnabled && float,
          'body-bounce': animationsEnabled && bounce,
          'body-sway': animationsEnabled && sway,
        }"
      >
        <g id="body-legs">
          <path
            v-for="side in SIDES"
            :key="side"
            :d="SAPIN_THIGH"
            :transform="mirror(side)"
            :fill="bodyColor"
          />
          <path
            v-for="side in SIDES"
            :key="`${side}-shade`"
            class="leg-shade"
            :d="SAPIN_SHIN_SHADE"
            :transform="mirror(side)"
            fill="#000"
            fill-opacity="0.16"
          />
        </g>

        <ellipse id="body-main" cx="160" cy="127" rx="72.5" ry="65.5" :fill="bodyColor" />

        <g id="body-eye-bumps">
          <circle
            v-for="side in SIDES"
            :key="side"
            :cx="SAPIN_EYES[side].x"
            :cy="SAPIN_EYES[side].y + SAPIN_BUMP.dy"
            :r="SAPIN_BUMP.r"
            :fill="bodyColor"
          />
        </g>

        <!-- Branco translucido: a barriga sai clara em qualquer cor de humor. -->
        <ellipse
          id="body-belly"
          cx="160"
          cy="158"
          rx="46.5"
          ry="34.5"
          fill="#fff"
          fill-opacity="0.72"
        />

        <g id="body-toes" :class="{ 'toes-tap': animationsEnabled && tapToes }">
          <g v-for="side in SIDES" :key="side" :transform="mirror(side)">
            <path
              v-for="(toe, index) in SAPIN_TOES"
              :key="`finger-${index}`"
              :d="`M${SAPIN_ANKLE.x} ${SAPIN_ANKLE.y} L${toe.x} ${toe.y}`"
              :stroke="bodyColor"
              stroke-width="5"
              stroke-linecap="round"
            />
            <circle
              v-for="(toe, index) in SAPIN_TOES"
              :key="`toe-${index}`"
              class="toe"
              :cx="toe.x"
              :cy="toe.y"
              r="5"
              :fill="bodyColor"
            />
          </g>
        </g>
      </g>
    </template>

    <template v-else>
      <ellipse
        id="body-main"
        cx="160"
        cy="110"
        rx="65"
        ry="65"
        :fill="bodyColor"
        :class="{
          'body-float': animationsEnabled && float,
          'body-bounce': animationsEnabled && bounce,
          'body-sway': animationsEnabled && sway,
        }"
      />
      <ellipse
        id="body-highlight"
        cx="145"
        cy="95"
        rx="25"
        ry="30"
        :fill="bodyHighlight"
        opacity="0.6"
      />
    </template>
  </g>
</template>

<script setup lang="ts">
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';
import { EYE_GEOMETRY } from '../taskin-eyes/TaskinEyes.types';

export interface Props {
  bodyColor?: string;
  bodyHighlight?: string;
  animationsEnabled?: boolean;
  float?: boolean;
  bounce?: boolean;
  sway?: boolean;
  /** Which character to draw: the round octopus body or the frog, legs included. */
  variant?: TaskinVariant;
  /** The Sapin taps its toes (its idle wiggle, in place of the tentacles'). */
  tapToes?: boolean;
}

withDefaults(defineProps<Props>(), {
  bodyColor: '#FF6B9D',
  bodyHighlight: '#FFB6D9',
  animationsEnabled: true,
  float: false,
  bounce: false,
  sway: false,
  variant: 'taskin',
  tapToes: false,
});

const SIDES = ['left', 'right'] as const;

/** A perna direita e a esquerda espelhada no eixo do corpo (x = 160). */
const mirror = (side: (typeof SIDES)[number]): string | undefined =>
  side === 'right' ? 'translate(320 0) scale(-1 1)' : undefined;

// Os calombos envolvem os olhos: o centro vem da geometria dos olhos, e nao de
// uma copia do numero.
const SAPIN_EYES = EYE_GEOMETRY.sapin;
const SAPIN_BUMP = { r: 23, dy: -2 } as const;

/** Coxa esquerda: sai de tras do corpo, faz o joelho para fora e desce ate o tornozelo. */
const SAPIN_THIGH =
  'M128 168 C110 158 88 166 84 181 C81 195 94 206 111 214 L125 221 C131 223 136 219 136 213 L136 186 Z';

/** A canela, o tom mais escuro no lado de dentro da coxa, descendo ate o pe. */
const SAPIN_SHIN_SHADE =
  'M116 177 C120 192 125 205 131 216 C134 218 136 216 136 213 L136 186 C130 181 123 178 116 177 Z';

const SAPIN_ANKLE = { x: 127, y: 220 } as const;

/** Os tres dedos do pe esquerdo, em bolinha, como na referencia. */
const SAPIN_TOES = [
  { x: 100, y: 226 },
  { x: 113, y: 231 },
  { x: 130, y: 229 },
] as const;
</script>

<script lang="ts">
export default {
  name: 'TaskinBody',
};
</script>

<style scoped>
.body-float {
  animation: float 3s ease-in-out infinite;
}

.body-bounce {
  animation: bounce 0.5s ease-in-out;
}

.body-sway {
  animation: sway 2s ease-in-out infinite;
  transform-origin: center center;
}

#body-sapin.body-sway {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.toes-tap {
  animation: toes-tap 0.4s ease-in-out 2;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-2deg);
  }
  75% {
    transform: rotate(2deg);
  }
}

@keyframes toes-tap {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
</style>
