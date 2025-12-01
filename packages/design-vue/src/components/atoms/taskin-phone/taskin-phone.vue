<template>
  <g id="phone">
    <rect
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :rx="cornerRadius"
      :fill="phoneColor"
      :stroke="phoneStroke"
      :stroke-width="strokeWidth"
    />
    <rect
      :x="x + 2"
      :y="y + 3"
      :width="width - 4"
      :height="height - 10"
      :rx="1"
      :fill="screenColor"
    />
    <circle
      :cx="x + width / 2"
      :cy="y + 1.5"
      :r="speakerRadius"
      :fill="speakerColor"
    />
  </g>
</template>

<script setup lang="ts">
export interface Props {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cornerRadius?: number;
  phoneColor?: string;
  phoneStroke?: string;
  strokeWidth?: number;
  screenColor?: string;
  speakerColor?: string;
  speakerRadius?: number;
  animationsEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  x: 230,
  y: 47.5,
  width: 20,
  height: 35,
  cornerRadius: 3,
  phoneColor: '#2C3E50',
  phoneStroke: '#34495E',
  strokeWidth: 1,
  screenColor: '#3498DB',
  speakerColor: '#FFD700',
  speakerRadius: 1.5,
  animationsEnabled: true,
});
</script>

<script lang="ts">
export default {
  name: 'TaskinPhone',
};
</script>
