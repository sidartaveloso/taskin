<template>
  <g id="eyes" ref="eyesContainer">
    <g id="left-eye" :transform="leftEyeTransform">
      <ellipse
        :cx="geometry.left.x"
        :cy="geometry.left.y"
        :rx="geometry.rx"
        :ry="eyeHeight"
        fill="white"
        :stroke="outlineColor"
        stroke-width="2"
      />
      <circle
        :cx="geometry.left.x + geometry.pupilRest.left.x + leftPupilOffsetX"
        :cy="geometry.left.y + geometry.pupilRest.left.y + leftPupilOffsetY"
        :r="pupilRadius"
        :fill="geometry.ink"
      />
    </g>

    <g id="right-eye" :transform="rightEyeTransform">
      <ellipse
        :cx="geometry.right.x"
        :cy="geometry.right.y"
        :rx="geometry.rx"
        :ry="eyeHeight"
        fill="white"
        :stroke="outlineColor"
        stroke-width="2"
      />
      <circle
        :cx="geometry.right.x + geometry.pupilRest.right.x + rightPupilOffsetX"
        :cy="geometry.right.y + geometry.pupilRest.right.y + rightPupilOffsetY"
        :r="pupilRadius"
        :fill="geometry.ink"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useElementTracking, useEyeTracking, useMouseTracking } from '../../../composables';
import { TASKIN_EYE_GEOMETRY, type TaskinEyesProps } from './TaskinEyes.types';

const props = withDefaults(defineProps<TaskinEyesProps>(), {
  state: 'normal',
  animationsEnabled: true,
  trackingBounds: 6,
  trackingMode: 'mouse',
  lookDirection: 'center',
  geometry: () => TASKIN_EYE_GEOMETRY,
});

const geometry = computed(() => props.geometry);

// O olho fechado desenha sempre o traco: sem ele, no Sapin, que nao tem
// contorno, a palpebra sumiria no verde.
const outlineColor = computed(() => (geometry.value.outline || props.state === 'closed' ? geometry.value.ink : 'none'));

// Referência ao container SVG
const eyesContainer = ref<SVGElement | null>(null);

// Eye appearance based on state
const eyeHeight = computed(() => geometry.value.ry[props.state]);

const pupilRadius = computed(() => geometry.value.pupilRadius[props.state]);

// Tracking logic
const trackingMode = computed(() => props.trackingMode || 'mouse');

// Mouse tracking
const mouseTracking = useMouseTracking();

// Element tracking
const targetElement = computed(() => (trackingMode.value === 'element' ? props.targetElement : undefined));
const elementTracking = useElementTracking(() => targetElement.value);

// Custom position tracking
const customPosition = computed(() =>
  trackingMode.value === 'custom' && props.customPosition ? props.customPosition : { x: 0, y: 0 },
);

// Determina a posição do alvo baseado no modo
const targetPosition = computed<{ x: number; y: number }>(() => {
  switch (trackingMode.value) {
    case 'mouse':
      return mouseTracking.position.value;
    case 'element':
      return elementTracking.position.value;
    case 'custom':
      return customPosition.value;
    default:
      return { x: 0, y: 0 };
  }
});

// O useEyeTracking le os centros uma vez, no setup: quem troca a variante com o
// componente montado precisa remonta-lo (o `Taskin` faz isso pela `key`).
// Eye tracking para o olho esquerdo
const leftEyeTracking = useEyeTracking(targetPosition, {
  eyeCenterX: geometry.value.left.x,
  eyeCenterY: geometry.value.left.y,
  maxOffset: props.trackingBounds,
  containerElement: eyesContainer,
});

// Eye tracking para o olho direito
const rightEyeTracking = useEyeTracking(targetPosition, {
  eyeCenterX: geometry.value.right.x,
  eyeCenterY: geometry.value.right.y,
  maxOffset: props.trackingBounds,
  containerElement: eyesContainer,
});

// Pupil offset - usa tracking ou lookDirection manual
const leftPupilOffsetX = computed(() => {
  if (trackingMode.value !== 'none') {
    return leftEyeTracking.pupilOffset.value.x;
  }
  // Manual lookDirection
  switch (props.lookDirection) {
    case 'left':
      return -3;
    case 'right':
      return 3;
    default:
      return 0;
  }
});

const leftPupilOffsetY = computed(() => {
  if (trackingMode.value !== 'none') {
    return leftEyeTracking.pupilOffset.value.y;
  }
  // Manual lookDirection
  switch (props.lookDirection) {
    case 'up':
      return -3;
    case 'down':
      return 3;
    default:
      return 0;
  }
});

const rightPupilOffsetX = computed(() => {
  if (trackingMode.value !== 'none') {
    return rightEyeTracking.pupilOffset.value.x;
  }
  // Manual lookDirection
  switch (props.lookDirection) {
    case 'left':
      return -3;
    case 'right':
      return 3;
    default:
      return 0;
  }
});

const rightPupilOffsetY = computed(() => {
  if (trackingMode.value !== 'none') {
    return rightEyeTracking.pupilOffset.value.y;
  }
  // Manual lookDirection
  switch (props.lookDirection) {
    case 'up':
      return -3;
    case 'down':
      return 3;
    default:
      return 0;
  }
});

const leftEyeTransform = computed(() => {
  return props.animationsEnabled ? 'translate(0, 0)' : '';
});

const rightEyeTransform = computed(() => {
  return props.animationsEnabled ? 'translate(0, 0)' : '';
});
</script>

<script lang="ts">
export default {
  name: 'TaskinEyes',
};
</script>
