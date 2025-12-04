<template>
  <div class="taskin-face-tracking">
    <!-- Webcam -->
    <WebcamVideo
      ref="webcamVideoRef"
      :visible="showWebcam"
      :width="320"
      :height="240"
      :mirrored="true"
    />

    <!-- Controles -->
    <FaceTrackingControls
      :is-detecting="faceLandmarker.state.value.isDetecting"
      :error="faceLandmarker.state.value.error"
      :show-webcam="showWebcam"
      :sync-eyes="syncEyes"
      :sync-mouth="syncMouth"
      :sync-expressions="syncExpressions"
      :disabled="faceLandmarker.state.value.error !== null"
      @toggle-tracking="toggleTracking"
      @update:show-webcam="showWebcam = $event"
      @update:sync-eyes="syncEyes = $event"
      @update:sync-mouth="syncMouth = $event"
      @update:sync-expressions="syncExpressions = $event"
    />

    <!-- Taskin Mascot -->
    <div class="mascot-container" ref="mascotContainer">
      <TaskinComposed
        :mood="currentMood"
        :size="mascotSize"
        :eye-tracking-mode="eyeTrackingMode"
        :eye-custom-position="eyePosition"
        :eye-state="eyeState"
        :animations-enabled="true"
      />
    </div>

    <!-- Debug Info -->
    <FaceTrackingDebug
      v-if="showDebug"
      :data="debugInfo"
      title="BlendShapes"
      position="top-right"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import WebcamVideo from '../../atoms/webcam-video';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';
import TaskinComposed from './taskin-composed';
import type { TaskinMood } from './taskin.types';

export interface Props {
  mascotSize?: number;
  showWebcam?: boolean;
  showDebug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mascotSize: 300,
  showWebcam: false,
  showDebug: false,
});

// Refs
const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
const mascotContainer = ref<HTMLDivElement | null>(null);
const showWebcam = ref(props.showWebcam);
const syncEyes = ref(true);
const syncMouth = ref(true);
const syncExpressions = ref(true);

// Video element do WebcamVideo
const videoElement = ref<HTMLVideoElement | null>(null);

// Após montar, obtém a referência do vídeo
onMounted(() => {
  if (webcamVideoRef.value) {
    videoElement.value = webcamVideoRef.value.videoElement;
  }
});

// Face Landmarker
const faceLandmarker = useFaceLandmarker(videoElement, {
  enableBlendshapes: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

// Estado do Taskin
const currentMood = ref<TaskinMood>('neutral');
const eyeTrackingMode = ref<'none' | 'mouse' | 'element' | 'custom'>('none');
const eyePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const eyeState = ref<'normal' | 'closed' | 'squint' | 'wide'>('normal');

// Controle
const toggleTracking = () => {
  if (faceLandmarker.state.value.isDetecting) {
    faceLandmarker.stopDetection();
  } else {
    faceLandmarker.startDetection();
  }
};

// Sincronização dos olhos
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes || !syncEyes.value || !mascotContainer.value) {
      eyeTrackingMode.value = 'none';
      eyeState.value = 'normal';
      return;
    }

    eyeTrackingMode.value = 'custom';

    // Movimento dos olhos - converte para coordenadas absolutas da viewport
    const eyeLook = faceLandmarker.getEyeLookDirection();
    const mascotRect = mascotContainer.value.getBoundingClientRect();
    const mascotCenterX = mascotRect.left + mascotRect.width / 2;
    const mascotCenterY = mascotRect.top + mascotRect.height / 2;

    eyePosition.value = {
      x: mascotCenterX + eyeLook.x * 3, // Amplifica o movimento relativo ao centro do mascote
      y: mascotCenterY + eyeLook.y * 3,
    };

    // Estado dos olhos (aberto/fechado/arregalado)
    const eyeOpenness = faceLandmarker.getEyeOpenness();
    const avgOpenness = (eyeOpenness.left + eyeOpenness.right) / 2;

    if (faceLandmarker.isEyesWide()) {
      eyeState.value = 'wide';
    } else if (avgOpenness < 0.3) {
      eyeState.value = 'closed';
    } else if (avgOpenness < 0.6) {
      eyeState.value = 'squint';
    } else {
      eyeState.value = 'normal';
    }
  },
);

// Sincronização da boca e expressões
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes) return;

    if (syncExpressions.value) {
      const smileIntensity = faceLandmarker.getSmileIntensity();
      const frownIntensity = faceLandmarker.getFrownIntensity();
      const mouthOpenness = faceLandmarker.getMouthOpenness();
      const isWide = faceLandmarker.isEyesWide();

      // Determina o mood baseado nas expressões
      // Prioridade: sorriso > franzir > boca aberta > olhos arregalados
      if (smileIntensity > 0.5) {
        currentMood.value = 'happy';
      } else if (smileIntensity > 0.3) {
        currentMood.value = 'smirk';
      } else if (frownIntensity > 0.4) {
        currentMood.value = 'annoyed';
      } else if (mouthOpenness > 0.6) {
        currentMood.value = 'sarcastic';
      } else if (isWide) {
        currentMood.value = 'furious';
      } else if (mouthOpenness > 0.3) {
        // Boca meio aberta = neutro falando
        currentMood.value = 'neutral';
      } else {
        currentMood.value = 'neutral';
      }
    }
  },
);

// Debug info
const debugInfo = computed(() => {
  const bs = faceLandmarker.state.value.blendShapes;
  if (!bs) return null;

  const eyeLook = faceLandmarker.getEyeLookDirection();
  const eyeOpenness = faceLandmarker.getEyeOpenness();
  return {
    smile: faceLandmarker.getSmileIntensity().toFixed(2),
    frown: faceLandmarker.getFrownIntensity().toFixed(2),
    mouthOpen: faceLandmarker.getMouthOpenness().toFixed(2),
    eyesWide: faceLandmarker.isEyesWide(),
    eyeLook: {
      x: (eyeLook.x >= 0 ? '+' : '') + eyeLook.x.toFixed(15),
      y: (eyeLook.y >= 0 ? '+' : '') + eyeLook.y.toFixed(15),
    },
    eyeOpenness: {
      left: (eyeOpenness.left >= 0 ? '+' : '') + eyeOpenness.left.toFixed(10),
      right:
        (eyeOpenness.right >= 0 ? '+' : '') + eyeOpenness.right.toFixed(10),
    },
  };
});
</script>

<script lang="ts">
export default {
  name: 'TaskinWithFaceTracking',
};
</script>

<style scoped>
.taskin-face-tracking {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  position: relative;
}

.mascot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
