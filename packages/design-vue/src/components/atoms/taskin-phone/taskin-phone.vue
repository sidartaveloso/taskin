<template>
  <g id="phone">
    <!-- Phone body centered at (0,0) -->
    <rect
      :x="-width / 2"
      :y="-height / 2"
      :width="width"
      :height="height"
      :rx="cornerRadius"
      :fill="phoneColor"
      :stroke="phoneStroke"
      :stroke-width="strokeWidth"
    />
    <!-- Screen -->
    <rect
      :x="-width / 2 + 2"
      :y="-height / 2 + 3"
      :width="width - 4"
      :height="height - 10"
      :rx="1"
      :fill="screenColor"
    />
    <!-- Speaker -->
    <circle
      :cx="0"
      :cy="-height / 2 + 1.5"
      :r="speakerRadius"
      :fill="speakerColor"
    />
  </g>
</template>

<script setup lang="ts">
export interface Props {
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
