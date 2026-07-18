<template>
  <g
    id="tentacle-with-item"
    :transform="`translate(${translateX}, ${translateY}) rotate(${rotation}, 0, 0)`"
  >
    <!-- Tentáculo base -->
    <TaskinTentacle
      :color="tentacleColor"
      :d="tentaclePath"
      :fluid="fluid"
      :speed="speed"
      :wiggle="wiggle"
      :dance="dance"
      :curl="curl"
      :uncurl="uncurl"
      :animations-enabled="animationsEnabled"
      :length="length"
      :x="0"
      :y="0"
    >
      <template #tip>
        <!-- Slot para item na ponta do tentáculo -->
        <slot name="item">
          <!-- Item padrão se nenhum for fornecido -->
          <!-- <circle cx="0" cy="0" r="5" fill="#FFD700" /> -->
        </slot>
      </template>
    </TaskinTentacle>
  </g>
</template>

<script setup lang="ts">
import TaskinTentacle from '../../atoms/taskin-tentacle/taskin-tentacle';

export interface Props {
  tentacleColor?: string;
  tentaclePath?: string;
  fluid?: boolean;
  speed?: number;
  wiggle?: boolean;
  dance?: boolean;
  curl?: boolean;
  uncurl?: boolean;
  translateX?: number;
  translateY?: number;
  rotation?: number;
  length?: number;
  animationsEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  tentacleColor: '#FF6B9D',
  tentaclePath: 'M 0,0 C -5,15 -10,30 0,45 C 10,60 5,75 0,80',
  fluid: false,
  speed: 1,
  wiggle: false,
  dance: false,
  curl: false,
  uncurl: false,
  translateX: 0,
  translateY: 0,
  rotation: 0,
  length: 60,
  animationsEnabled: true,
});
</script>

<script lang="ts">
export default {
  name: 'TaskinTentacleWithItem',
};
</script>

<style scoped>
/* Sem animações CSS - o item fica na posição definida via props */
</style>
