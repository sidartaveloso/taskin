<template>
  <div class="face-tracking-debug" v-if="data" :class="position">
    <h4>{{ title }}</h4>
    <pre>{{ data }}</pre>
  </div>
</template>

<script setup lang="ts">
import type { FaceTrackingDebugProps } from './face-tracking-debug.types';

withDefaults(defineProps<FaceTrackingDebugProps>(), {
  title: 'Debug Info',
  position: 'top-right',
});
</script>

<script lang="ts">
export default {
  name: 'FaceTrackingDebug',
};
</script>

<style scoped>
.face-tracking-debug {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  max-width: 300px;
  max-height: 400px;
  overflow: auto;
}

.face-tracking-debug.top-right {
  top: 20px;
  right: 20px;
}

.face-tracking-debug.top-left {
  top: 20px;
  left: 20px;
}

.face-tracking-debug.bottom-right {
  bottom: 20px;
  right: 20px;
}

.face-tracking-debug.bottom-left {
  bottom: 20px;
  left: 20px;
}

.face-tracking-debug h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.face-tracking-debug pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
