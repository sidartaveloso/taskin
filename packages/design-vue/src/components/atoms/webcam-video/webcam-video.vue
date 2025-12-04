<template>
  <video
    class="webcam-video"
    ref="videoElement"
    :class="{ visible, mirrored }"
    :style="{ width: `${width}px`, height: `${height}px` }"
    autoplay
    playsinline
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WebcamVideoProps } from './webcam-video.types';

withDefaults(defineProps<WebcamVideoProps>(), {
  visible: false,
  width: 320,
  height: 240,
  mirrored: true,
});

const videoElement = ref<HTMLVideoElement | null>(null);

defineExpose({
  videoElement,
});
</script>

<script lang="ts">
export default {
  name: 'WebcamVideo',
};
</script>

<style scoped>
.webcam-video {
  display: none;
  border: 2px solid #1f7acb;
  border-radius: 8px;
}

.webcam-video.visible {
  display: block;
}

.webcam-video.mirrored {
  transform: scaleX(-1);
}
</style>
