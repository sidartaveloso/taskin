<template>
  <div class="taskin-face-tracking">
    <!-- Webcam (oculta) -->
    <video
      class="webcam-feed"
      ref="videoElement"
      :class="{ visible: showWebcam }"
      autoplay
      playsinline
    />

    <!-- Controles -->
    <div class="controls">
      <button
        class="control-button"
        :disabled="faceLandmarker.state.value.error !== null"
        @click="toggleTracking"
      >
        {{ faceLandmarker.state.value.isDetecting ? 'Parar' : 'Iniciar' }}
        Detecção
      </button>

      <label class="control-checkbox">
        <input v-model="showWebcam" type="checkbox" />
        Mostrar Webcam
      </label>

      <label class="control-checkbox">
        <input v-model="syncEyes" type="checkbox" />
        Sincronizar Olhos
      </label>

      <label class="control-checkbox">
        <input v-model="syncMouth" type="checkbox" />
        Sincronizar Boca
      </label>

      <label class="control-checkbox">
        <input v-model="syncExpressions" type="checkbox" />
        Sincronizar Expressões
      </label>

      <div class="error" v-if="faceLandmarker.state.value.error">
        {{ faceLandmarker.state.value.error }}
      </div>

      <div class="status" v-if="faceLandmarker.state.value.isDetecting">
        <span class="status-indicator" />
        Detectando...
      </div>
    </div>

    <!-- Taskin Mascot -->
    <div class="mascot-container">
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
    <div class="debug-info" v-if="showDebug">
      <h4>BlendShapes:</h4>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
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
const videoElement = ref<HTMLVideoElement | null>(null);
const showWebcam = ref(props.showWebcam);
const syncEyes = ref(true);
const syncMouth = ref(true);
const syncExpressions = ref(true);

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
    if (!blendShapes || !syncEyes.value) {
      eyeTrackingMode.value = 'none';
      eyeState.value = 'normal';
      return;
    }

    eyeTrackingMode.value = 'custom';

    // Movimento dos olhos
    const eyeLook = faceLandmarker.getEyeLookDirection();
    eyePosition.value = {
      x: eyeLook.x * 3, // Amplifica o movimento
      y: eyeLook.y * 3,
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

  return {
    smile: faceLandmarker.getSmileIntensity().toFixed(2),
    frown: faceLandmarker.getFrownIntensity().toFixed(2),
    mouthOpen: faceLandmarker.getMouthOpenness().toFixed(2),
    eyesWide: faceLandmarker.isEyesWide(),
    eyeLook: faceLandmarker.getEyeLookDirection(),
    eyeOpenness: faceLandmarker.getEyeOpenness(),
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

.webcam-feed {
  display: none;
  width: 320px;
  height: 240px;
  border: 2px solid #1f7acb;
  border-radius: 8px;
  transform: scaleX(-1); /* Efeito espelho */
}

.webcam-feed.visible {
  display: block;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  justify-content: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.control-button {
  padding: 10px 20px;
  background: #1f7acb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
}

.control-button:hover:not(:disabled) {
  background: #1a6bb0;
}

.control-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.control-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.control-checkbox input {
  cursor: pointer;
}

.error {
  color: #d32f2f;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
  width: 100%;
  text-align: center;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32;
  font-weight: 500;
}

.status-indicator {
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.mascot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.debug-info {
  position: absolute;
  top: 20px;
  right: 20px;
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

.debug-info h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
