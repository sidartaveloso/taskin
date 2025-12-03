<template>
  <g id="eyes" ref="eyesContainer">
    <g id="left-eye" :transform="leftEyeTransform">
      <ellipse
        cx="135"
        cy="90"
        rx="12"
        :ry="eyeHeight"
        fill="white"
        stroke="#2C3E50"
        stroke-width="2"
      />
      <circle
        :cx="135 + leftPupilOffsetX"
        :cy="90 + leftPupilOffsetY"
        :r="pupilRadius"
        fill="#2C3E50"
      />
    </g>

    <g id="right-eye" :transform="rightEyeTransform">
      <ellipse
        cx="185"
        cy="90"
        rx="12"
        :ry="eyeHeight"
        fill="white"
        stroke="#2C3E50"
        stroke-width="2"
      />
      <circle
        :cx="185 + rightPupilOffsetX"
        :cy="90 + rightPupilOffsetY"
        :r="pupilRadius"
        fill="#2C3E50"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useElementTracking,
  useEyeTracking,
  useMouseTracking,
} from '../../../composables';
import type { TaskinEyesProps } from './taskin-eyes.types';

const props = withDefaults(defineProps<TaskinEyesProps>(), {
  state: 'normal',
  animationsEnabled: true,
  trackingBounds: 6,
  trackingMode: 'mouse',
  lookDirection: 'center',
});

// Referência ao container SVG
const eyesContainer = ref<SVGElement | null>(null);

// Eye appearance based on state
const eyeHeight = computed(() => {
  switch (props.state) {
    case 'closed':
      return 1;
    case 'squint':
      return 8;
    case 'wide':
      return 18;
    case 'normal':
    default:
      return 14;
  }
});

const pupilRadius = computed(() => {
  switch (props.state) {
    case 'wide':
      return 3;
    case 'squint':
      return 2;
    case 'closed':
      return 0;
    case 'normal':
    default:
      return 5;
  }
});

// Tracking logic
const trackingMode = computed(() => props.trackingMode || 'mouse');

// Mouse tracking
const mouseTracking = useMouseTracking();

// Element tracking
const targetElement = computed(() =>
  trackingMode.value === 'element' ? props.targetElement : undefined,
);
const elementTracking = useElementTracking(() => targetElement.value);

// Custom position tracking
const customPosition = computed(() =>
  trackingMode.value === 'custom' && props.customPosition
    ? props.customPosition
    : { x: 0, y: 0 },
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

// Eye tracking para o olho esquerdo
const leftEyeTracking = useEyeTracking(targetPosition, {
  eyeCenterX: 135,
  eyeCenterY: 90,
  maxOffset: props.trackingBounds,
  containerElement: eyesContainer,
});

// Eye tracking para o olho direito
const rightEyeTracking = useEyeTracking(targetPosition, {
  eyeCenterX: 185,
  eyeCenterY: 90,
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
