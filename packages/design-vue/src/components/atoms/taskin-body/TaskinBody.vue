<template>
  <g id="body" :data-variant="variant">
    <template v-if="variant === 'sapin'">
      <!--
        O Sapin, medido na referencia (TASKS/assets/sapin/sapin-mascote.png).
        As coxas fazem parte da silhueta do sapo, por isso moram no corpo: vem
        atras, o corpo por cima, depois a sombra dos olhos, os calombos, a
        barriga e, por ultimo, os pes.
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
            fill-opacity="0.2"
          />
        </g>

        <defs>
          <clipPath :id="bodyClipId">
            <path :d="SAPIN_BODY" />
          </clipPath>
        </defs>

        <path id="body-main" :d="SAPIN_BODY" :fill="bodyColor" />

        <!--
          A sombra dos olhos: cada calombo projeta no corpo uma meia-lua mais
          escura, embaixo e do lado de fora. E um circulo do tamanho do calombo,
          deslocado, que o calombo cobre por cima; o recorte pelo corpo tira o
          que cairia fora dele.
        -->
        <g id="body-eye-shadows" :clip-path="`url(#${bodyClipId})`">
          <circle
            v-for="side in SIDES"
            :key="side"
            :cx="SAPIN_EYES[side].x + SAPIN_EYE_SHADOW[side].dx"
            :cy="SAPIN_EYES[side].y + SAPIN_BUMP.dy + SAPIN_EYE_SHADOW[side].dy"
            :r="SAPIN_BUMP.r"
            fill="#000"
            fill-opacity="0.2"
          />
        </g>

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

        <!-- O papo: murcho em repouso; a comemoracao o infla, e a fala e a lingua o reaproveitam. -->
        <ellipse id="body-throat" cx="160" cy="118" rx="15" ry="8" fill="#fff" fill-opacity="0.72" />

        <g id="body-toes" :class="{ 'toes-tap': animationsEnabled && tapToes }">
          <g v-for="side in SIDES" :key="side" :transform="mirror(side)">
            <path :d="SAPIN_PALM" :fill="bodyColor" />
            <path
              v-for="(finger, index) in SAPIN_FINGERS"
              :key="`finger-${index}`"
              :d="`M${finger.from.x} ${finger.from.y} L${finger.to.x} ${finger.to.y}`"
              :stroke="bodyColor"
              stroke-width="7"
              stroke-linecap="round"
            />
            <circle
              v-for="(finger, index) in SAPIN_FINGERS"
              :key="`toe-${index}`"
              class="toe"
              :cx="finger.to.x"
              :cy="finger.to.y"
              :r="SAPIN_TOE_RADIUS"
              :fill="bodyColor"
            />
            <!-- As pontas dos dedos sao um tom mais escuras que o pe. -->
            <g opacity="0.16">
              <circle
                v-for="(finger, index) in SAPIN_FINGERS"
                :key="`toe-shade-${index}`"
                class="toe-shade"
                :cx="finger.to.x"
                :cy="finger.to.y"
                :r="SAPIN_TOE_RADIUS"
              />
            </g>
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
import { useId } from 'vue';
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

// O recorte da sombra dos olhos precisa de um id, e o id, de ser unico: com
// dois mascotes na pagina, um `url(#...)` repetido pegaria o do outro.
const bodyClipId = `${useId()}-sapin-body`;

/**
 * O corpo do Sapin: mais cheio na metade de cima que uma elipse — na referencia
 * ele e 2 a 3 unidades mais largo logo abaixo dos calombos, e igual a elipse da
 * cintura para baixo. Metade de cima de superelipse (controle 0,64 do raio),
 * metade de baixo eliptica (0,5523).
 */
const SAPIN_BODY =
  'M87.5 127 C87.5 85.08 113.6 61.5 160 61.5 C206.4 61.5 232.5 85.08 232.5 127 C232.5 163.18 200.04 192.5 160 192.5 C119.96 192.5 87.5 163.18 87.5 127 Z';

// Os calombos envolvem os olhos: o centro vem da geometria dos olhos, e nao de
// uma copia do numero.
const SAPIN_EYES = EYE_GEOMETRY.sapin;
const SAPIN_BUMP = { r: 23.5, dy: -2.5 } as const;

/** Para onde a sombra de cada calombo cai: para baixo e para fora. */
const SAPIN_EYE_SHADOW = {
  left: { dx: -3, dy: 0.6 },
  right: { dx: 3, dy: 0.6 },
} as const;

/**
 * Coxa esquerda: sai de tras do corpo, faz o joelho para fora e recolhe ate o
 * tornozelo; a borda de dentro e a canela, que desce na diagonal ate o pe.
 */
const SAPIN_THIGH =
  'M129 163 C110 155 88 162 86 177.5 C84.5 190 97 203.5 114 212 L127 219 C132 221 136 219 136 216 C135 209 131 202 130 195 L130 176 Z';

/** A canela, o tom mais escuro no lado de dentro da coxa, descendo ate o pe. */
const SAPIN_SHIN_SHADE =
  'M114 176 C119 191 124 204 130 215 C133 218 136 218 136 216 C135 209 131 202 130 195 L130 180 C125 178 119 176 114 176 Z';

/** A base do pe, de onde os tres dedos saem em leque. */
const SAPIN_PALM = 'M116 213 L131 213 L134 221 L121 221 Z';

/** Os tres dedos do pe esquerdo, grossos, cada um terminando numa bolinha. */
const SAPIN_FINGERS = [
  { from: { x: 119, y: 216 }, to: { x: 99.5, y: 226 } },
  { from: { x: 124, y: 219 }, to: { x: 113, y: 231 } },
  { from: { x: 134, y: 220 }, to: { x: 131, y: 229 } },
] as const;

const SAPIN_TOE_RADIUS = 5.2;
</script>

<script lang="ts">
export default {
  name: 'TaskinBody',
};
</script>

<style scoped>
#body-throat {
  transform: scale(0);
  transform-box: fill-box;
  transform-origin: 50% 0;
}

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
