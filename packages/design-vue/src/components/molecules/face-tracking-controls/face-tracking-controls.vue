<template>
  <div class="face-tracking-controls">
    <button
      class="control-button"
      :disabled="disabled"
      @click="emit('toggle-tracking')"
    >
      {{ isDetecting ? 'Parar' : 'Iniciar' }} Detecção
    </button>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="showWebcam"
        @change="
          emit('update:showWebcam', ($event.target as HTMLInputElement).checked)
        "
      />
      Mostrar Webcam
    </label>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="syncEyes"
        @change="
          emit('update:syncEyes', ($event.target as HTMLInputElement).checked)
        "
      />
      Sincronizar Olhos
    </label>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="syncMouth"
        @change="
          emit('update:syncMouth', ($event.target as HTMLInputElement).checked)
        "
      />
      Sincronizar Boca
    </label>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="syncExpressions"
        @change="
          emit(
            'update:syncExpressions',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      Sincronizar Expressões
    </label>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="syncArms"
        @change="
          emit('update:syncArms', ($event.target as HTMLInputElement).checked)
        "
      />
      Sincronizar Braços
    </label>

    <div class="error" v-if="error">
      {{ error }}
    </div>

    <div class="status" v-if="isDetecting">
      <span class="status-indicator" />
      Detectando...
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  FaceTrackingControlsEmits,
  FaceTrackingControlsProps,
} from './face-tracking-controls.types';

defineProps<FaceTrackingControlsProps>();

const emit = defineEmits<FaceTrackingControlsEmits>();
</script>

<script lang="ts">
export default {
  name: 'FaceTrackingControls',
};
</script>

<style scoped>
.face-tracking-controls {
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
</style>
