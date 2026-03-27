<template>
  <div class="taskin-shhh-tracking">
    <WebcamVideo
      ref="webcamVideoRef"
      :visible="showWebcam"
      :width="320"
      :height="240"
      :mirrored="true"
    />

    <FaceTrackingControls
      :is-detecting="faceLandmarker.state.value.isDetecting"
      :error="faceLandmarker.state.value.error"
      :show-webcam="showWebcam"
      :sync-eyes="syncEyes"
      :sync-mouth="syncMouth"
      :sync-expressions="syncExpressions"
      @toggle-tracking="toggleTracking"
      @update:show-webcam="showWebcam = $event"
      @update:sync-eyes="syncEyes = $event"
      @update:sync-mouth="syncMouth = $event"
      @update:sync-expressions="syncExpressions = $event"
    />

    <NoiseTrackingControls
      :is-active="!!noiseWatcher"
      :enable-noise-reactions="enableNoiseReactionsRef"
      :noise-threshold="noiseThresholdRef"
      :noise-debounce-ms="noiseDebounceMsRef"
      :noise-sound="noiseSoundRef"
      @toggle-noise="toggleNoise"
      @update:enableNoiseReactions="setEnableNoiseReactions"
      @update:noiseThreshold="setNoiseThreshold"
      @update:noiseDebounceMs="setNoiseDebounceMs"
      @update:noiseSound="setNoiseSound"
    />

    <div class="mascot-container" ref="mascotContainer">
      <TaskinComposed
        :mood="currentMood"
        :size="mascotSize"
        :eye-tracking-mode="eyeTrackingMode"
        :eye-custom-position="eyePosition"
        :eye-state="eyeState"
        :mouth-expression="mouthExpression"
        :animations-enabled="true"
        :show-thought-bubble="showThoughtBubble"
        :thought-bubble-text="thoughtBubbleText"
      />
    </div>

    <FaceTrackingDebug
      v-if="showDebug"
      :data="debugInfo"
      title="Shhh Detection"
      position="top-right"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import { createNoiseWatcher } from '../../../utils/noise-watcher';
import WebcamVideo from '../../atoms/webcam-video';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';
import NoiseTrackingControls from '../../molecules/noise-tracking-controls';
import TaskinComposed from './taskin-composed';
import type { TaskinMood } from './taskin.types';

export interface Props {
  mascotSize?: number;
  showWebcam?: boolean;
  showDebug?: boolean;
  // noise reaction props
  enableNoiseReactions?: boolean;
  noiseThreshold?: number; // RMS threshold (0..1)
  noiseDebounceMs?: number;
  noiseSound?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mascotSize: 300,
  showWebcam: false,
  showDebug: false,
  enableNoiseReactions: false,
  noiseThreshold: 0.06,
  noiseDebounceMs: 1500,
  noiseSound: false,
});

const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
const mascotContainer = ref<HTMLDivElement | null>(null);
const showWebcam = ref(props.showWebcam);
const syncEyes = ref(true);
const syncMouth = ref(true);
const syncExpressions = ref(true);

const videoElement = ref<HTMLVideoElement | null>(null);
onMounted(() => {
  if (webcamVideoRef.value)
    videoElement.value = webcamVideoRef.value.videoElement;
});

const faceLandmarker = useFaceLandmarker(videoElement, {
  enableBlendshapes: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  mirrorEyeTracking: true,
});

const currentMood = ref<TaskinMood>('neutral');
const eyeTrackingMode = ref<'none' | 'mouse' | 'element' | 'custom'>('none');
const eyePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const eyeState = ref<'normal' | 'closed' | 'squint' | 'wide'>('normal');
const mouthExpression = ref<
  | 'neutral'
  | 'smile'
  | 'frown'
  | 'open'
  | 'wide-open'
  | 'o-shape'
  | 'smirk'
  | 'surprised'
>('neutral');

const showThoughtBubble = ref(false);
const thoughtBubbleText = ref<string>('');

const mascotSize = ref(props.mascotSize);

// local noise config mirrors props and is editable by child control
const enableNoiseReactionsRef = ref<boolean>(!!props.enableNoiseReactions);
const noiseThresholdRef = ref<number>(props.noiseThreshold!);
const noiseDebounceMsRef = ref<number>(props.noiseDebounceMs!);
const noiseSoundRef = ref<boolean>(!!props.noiseSound);

const toggleTracking = () => {
  if (faceLandmarker.state.value.isDetecting) faceLandmarker.stopDetection();
  else faceLandmarker.startDetection();
};

// Noise watcher
let noiseWatcher: Awaited<ReturnType<typeof createNoiseWatcher>> | null = null;
let noiseUnsub: (() => void) | null = null;

const triggerShhhReaction = () => {
  showThoughtBubble.value = true;
  thoughtBubbleText.value = 'shh...';
  mouthExpression.value = 'o-shape';
  currentMood.value = 'thoughtful';

  setTimeout(() => {
    showThoughtBubble.value = false;
    thoughtBubbleText.value = '';
    mouthExpression.value = 'neutral';
    currentMood.value = 'neutral';
  }, 2000);
};

// setters used by child controls (avoid inline assignments in template)
function toggleNoise() {
  enableNoiseReactionsRef.value = !enableNoiseReactionsRef.value;
}

function setEnableNoiseReactions(v: boolean) {
  enableNoiseReactionsRef.value = v;
}

function setNoiseThreshold(v: number) {
  noiseThresholdRef.value = v;
}

function setNoiseDebounceMs(v: number) {
  noiseDebounceMsRef.value = v;
}

function setNoiseSound(v: boolean) {
  noiseSoundRef.value = v;
}

watch(syncEyes, (enabled) => {
  if (enabled && faceLandmarker.state.value.isDetecting)
    eyeTrackingMode.value = 'custom';
});

watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes || !mascotContainer.value) return;
    if (!syncEyes.value) return;

    eyeTrackingMode.value = 'custom';

    const eyeLook = faceLandmarker.getEyeLookDirection();
    const mascotRect = mascotContainer.value.getBoundingClientRect();
    const mascotCenterX = mascotRect.left + mascotRect.width / 2;
    const mascotCenterY = mascotRect.top + mascotRect.height / 2;

    eyePosition.value = {
      x: mascotCenterX + eyeLook.x * 3,
      y: mascotCenterY + eyeLook.y * 3,
    };

    const eyeOpenness = faceLandmarker.getEyeOpenness();
    const avgOpenness = (eyeOpenness.left + eyeOpenness.right) / 2;

    if (faceLandmarker.isEyesWide()) eyeState.value = 'wide';
    else if (avgOpenness < 0.3) eyeState.value = 'closed';
    else if (avgOpenness < 0.6) eyeState.value = 'squint';
    else eyeState.value = 'normal';
  },
);

// Shhh detection: simple heuristic using mouth openness and low smile/frown
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes) return;
    if (!syncMouth.value && !syncExpressions.value) return;

    const mouthOpenness = faceLandmarker.getMouthOpenness();
    const smile = faceLandmarker.getSmileIntensity();
    const frown = faceLandmarker.getFrownIntensity();

    // Heuristic: very closed mouth + low smile/frown => possible shhh (finger-to-lips not required)
    const shhhDetected = mouthOpenness < 0.12 && smile < 0.2 && frown < 0.2;

    if (shhhDetected) {
      triggerShhhReaction();
    }
  },
);

onMounted(async () => {
  if (enableNoiseReactionsRef.value) {
    try {
      noiseWatcher = await createNoiseWatcher();
      noiseUnsub = noiseWatcher.onNoiseAbove(
        noiseThresholdRef.value,
        () => {
          triggerShhhReaction();
          if (noiseSoundRef.value) {
            // no sound asset presently
          }
        },
        noiseDebounceMsRef.value,
      );
      // also subscribe to level updates
      noiseLevelUnsubLocal = noiseWatcher.subscribeLevel((rms: number) => {
        noiseLevel.value = rms;
      });
    } catch (e) {
      // ignore
    }
  }
});

onUnmounted(async () => {
  if (noiseUnsub) {
    try {
      noiseUnsub();
    } catch {}
    noiseUnsub = null;
  }
  if (noiseWatcher) {
    try {
      await noiseWatcher.stop();
    } catch {}
    noiseWatcher = null;
  }
});

// react to local noise config changes
watch(enableNoiseReactionsRef, async (v) => {
  if (v) {
    if (!noiseWatcher) {
      try {
        noiseWatcher = await createNoiseWatcher();
        noiseUnsub = noiseWatcher.onNoiseAbove(
          noiseThresholdRef.value,
          () => triggerShhhReaction(),
          noiseDebounceMsRef.value,
        );
        noiseLevelUnsubLocal = noiseWatcher.subscribeLevel(
          (rms: number) => (noiseLevel.value = rms),
        );
      } catch {}
    }
  } else {
    if (noiseUnsub) {
      try {
        noiseUnsub();
      } catch {}
      noiseUnsub = null;
    }
    if (noiseWatcher) {
      try {
        await noiseWatcher.stop();
      } catch {}
      noiseWatcher = null;
    }
  }
});

watch(noiseThresholdRef, (v) => {
  if (noiseUnsub && noiseWatcher) {
    try {
      noiseUnsub();
    } catch {}
    noiseUnsub = noiseWatcher.onNoiseAbove(
      v,
      () => triggerShhhReaction(),
      noiseDebounceMsRef.value,
    );
  }
});

watch(noiseDebounceMsRef, (v) => {
  if (noiseUnsub && noiseWatcher) {
    try {
      noiseUnsub();
    } catch {}
    noiseUnsub = noiseWatcher.onNoiseAbove(
      noiseThresholdRef.value,
      () => triggerShhhReaction(),
      v,
    );
  }
});

const noiseLevel = ref<number | null>(null);
let noiseLevelUnsubLocal: (() => void) | null = null;

const debugInfo = computed(() => {
  const bs = faceLandmarker.state.value.blendShapes;
  return {
    smile: bs ? faceLandmarker.getSmileIntensity().toFixed(2) : null,
    frown: bs ? faceLandmarker.getFrownIntensity().toFixed(2) : null,
    mouthOpen: bs ? faceLandmarker.getMouthOpenness().toFixed(2) : null,
    mouthExpression: mouthExpression.value,
    eyeLook: bs
      ? (() => {
          const eyeLook = faceLandmarker.getEyeLookDirection();
          return { x: eyeLook.x.toFixed(2), y: eyeLook.y.toFixed(2) };
        })()
      : null,
    eyeOpenness: bs
      ? (() => {
          const eyeOpenness = faceLandmarker.getEyeOpenness();
          return {
            left: eyeOpenness.left.toFixed(2),
            right: eyeOpenness.right.toFixed(2),
          };
        })()
      : null,
    noise: {
      enabled: enableNoiseReactionsRef.value,
      level: noiseLevel.value !== null ? noiseLevel.value.toFixed(4) : null,
      threshold: noiseThresholdRef.value,
      debounceMs: noiseDebounceMsRef.value,
      microphoneAvailable: !!noiseWatcher,
    },
  };
});

// subscribe to level updates when noise watcher available
onMounted(() => {
  if (noiseWatcher && enableNoiseReactionsRef.value) {
    noiseLevelUnsubLocal = noiseWatcher.subscribeLevel((rms: number) => {
      noiseLevel.value = rms;
    });
  }
});

onUnmounted(() => {
  if (noiseLevelUnsubLocal) {
    try {
      noiseLevelUnsubLocal();
    } catch {}
    noiseLevelUnsubLocal = null;
  }
});
</script>

<script lang="ts">
export default {
  name: 'TaskinWithShhh',
};
</script>

<style scoped>
.taskin-shhh-tracking {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.mascot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
