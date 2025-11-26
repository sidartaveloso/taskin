<template>
  <g id="arms">
    <path
      id="left-arm"
      d="M95 120 Q70 130 65 145"
      fill="none"
      :stroke="color"
      stroke-width="8"
      stroke-linecap="round"
    />
    <path
      id="right-arm"
      d="M225 120 Q250 130 255 145"
      fill="none"
      :stroke="color"
      stroke-width="8"
      stroke-linecap="round"
    />
  </g>
</template>

<script setup lang="ts">
export interface Props {
  color?: string;
  animationsEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  color: '#FF6B9D',
  animationsEnabled: true,
});
</script>

<script lang="ts">
export default {
  name: 'TaskinArms',
};
</script>
