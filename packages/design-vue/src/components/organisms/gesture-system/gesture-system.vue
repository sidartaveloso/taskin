<template>
  <div class="gesture-system">
    <video
      ref="videoRef"
      style="display: none"
      width="320"
      height="240"
      muted
      playsinline
    />

    <TrackingControls
      :is-detecting="detecting"
      :error="recorderState?.error ?? null"
      :show-webcam="showWebcam"
      :disabled="false"
      class="gesture-system__controls"
      @toggle-tracking="$emit('update:detecting', !detecting)"
      @update:show-webcam="showWebcam = $event"
    />

    <GestureLegend
      class="gesture-system__legend"
      :mappings="mappings"
      compact
    />

    <GestureWizard
      :wizard-state="wizardState"
      :ready-progress="readyProgress"
      :step="step"
      :recording-candidate="recordingCandidate"
      :selected-action-index="selectedActionIndex"
      :available-actions="wizardActions"
      :last-mapping="lastMapping"
      :teleport-to="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useGestureRecognizer } from '../../../composables/use-gesture-recognizer';
import type { PrioritizationAction } from '../../../composables/use-gesture-shortcuts';
import { useGestureShortcuts } from '../../../composables/use-gesture-shortcuts';
import GestureLegend from '../../molecules/gesture-legend/gesture-legend.vue';
import GestureWizard from '../../molecules/gesture-wizard/gesture-wizard.vue';
import TrackingControls from '../../molecules/tracking-controls/tracking-controls.vue';
import type { GestureSystemProps } from './gesture-system.types';

const props = defineProps<GestureSystemProps>();

const emit = defineEmits<{
  gestureAction: [action: string];
  'update:detecting': [value: boolean];
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const showWebcam = ref(false);

const {
  state: recorderState,
  startDetection,
  stopDetection,
  getStableGesture,
  isGestureHeld,
} = useGestureRecognizer(videoRef);

const {
  wizardState,
  readyProgress,
  step,
  recordingCandidate,
  selectedActionIndex,
  lastMapping,
  mappings,
  tick,
  getMappedAction,
  resetWizard,
} = useGestureShortcuts(getStableGesture, isGestureHeld, props.userId);

const wizardActions = computed<PrioritizationAction[]>(() => [
  ...props.functions.map((f) => f.id as PrioritizationAction),
  'none',
]);

let tickInterval: ReturnType<typeof setInterval> | null = null;

watch(
  () => props.detecting,
  (isDetecting) => {
    if (isDetecting) {
      startDetection();
      tickInterval = setInterval(() => {
        tick();
        const action = getMappedAction();
        if (action && action !== 'none') {
          emit('gestureAction', action);
        }
      }, 300);
    } else {
      stopDetection();
      if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      resetWizard();
    }
  },
);

onUnmounted(() => {
  stopDetection();
  if (tickInterval) {
    clearInterval(tickInterval);
  }
});
</script>

<style scoped>
.gesture-system {
  position: relative;
}

.gesture-system__controls {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}

.gesture-system__legend {
  position: fixed;
  bottom: 72px;
  right: 16px;
  z-index: 1000;
}
</style>
