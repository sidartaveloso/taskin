<template>
  <g id="eyes">
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
        :cx="135 + pupilOffsetX"
        :cy="90 + pupilOffsetY"
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
        :cx="185 + pupilOffsetX"
        :cy="90 + pupilOffsetY"
        :r="pupilRadius"
        fill="#2C3E50"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EyeState, LookDirection } from './taskin-eyes.types';

export interface Props {
  state?: EyeState;
  lookDirection?: LookDirection;
  animationsEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  state: 'normal',
  lookDirection: 'center',
  animationsEnabled: true,
});

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

const pupilOffsetX = computed(() => {
  switch (props.lookDirection) {
    case 'left':
      return -3;
    case 'right':
      return 3;
    case 'center':
    default:
      return 0;
  }
});

const pupilOffsetY = computed(() => {
  switch (props.lookDirection) {
    case 'up':
      return -3;
    case 'down':
      return 3;
    case 'center':
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
