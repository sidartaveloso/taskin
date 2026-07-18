<template>
  <div class="gesture-system">
    <video
      v-if="props.videoElement === undefined"
      ref="internalVideoRef"
      style="display: none"
      width="320"
      height="240"
      muted
      playsinline
    />
    <GestureLegend
      v-if="recorderState.isDetecting"
      class="gesture-system__legend"
      :mappings="mappings"
      compact
    />

    <GestureWizard
      v-if="recorderState.isDetecting"
      :wizard-state="wizardState"
      :ready-progress="readyProgress"
      :step="step"
      :recording-candidate="recordingCandidate"
      :selected-action-index="selectedActionIndex"
      :available-actions="wizardActions"
      :last-mapping="lastMapping"
      teleport-to="body"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useGestureRecognizer } from '../../../composables/use-gesture-recognizer';
import type { PrioritizationAction } from '../../../composables/use-gesture-shortcuts';
import { useGestureShortcuts } from '../../../composables/use-gesture-shortcuts';
import GestureLegend from '../../molecules/gesture-legend/GestureLegend.vue';
import GestureWizard from '../../molecules/gesture-wizard/GestureWizard.vue';
import type { GestureSystemProps } from './GestureSystem.types';

const props = defineProps<GestureSystemProps>();

const emit = defineEmits<{
  gestureAction: [action: string];
  'camera-active': [active: boolean];
}>();

const internalVideoRef = ref<HTMLVideoElement | null>(null);
const videoForRecognition = computed(() => props.videoElement ?? internalVideoRef.value);

const {
  state: recorderState,
  startDetection,
  stopDetection,
  getStableGesture,
  isGestureHeld,
} = useGestureRecognizer(videoForRecognition);

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

watch(
  () => recorderState.isDetecting,
  (active) => emit('camera-active', active),
);

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

.gesture-system__legend {
  display: flex;
  justify-content: flex-end;
}
</style>
