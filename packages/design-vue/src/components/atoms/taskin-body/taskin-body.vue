<template>
  <g id="body">
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
  </g>
</template>

<script setup lang="ts">
export interface Props {
  bodyColor?: string;
  bodyHighlight?: string;
  animationsEnabled?: boolean;
  float?: boolean;
  bounce?: boolean;
  sway?: boolean;
}

withDefaults(defineProps<Props>(), {
  bodyColor: '#FF6B9D',
  bodyHighlight: '#FFB6D9',
  animationsEnabled: true,
  float: false,
  bounce: false,
  sway: false,
});
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
</style>
