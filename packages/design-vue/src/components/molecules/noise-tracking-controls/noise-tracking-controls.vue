<template>
  <div class="noise-tracking-controls">
    <button
      class="control-button"
      :disabled="disabled"
      @click="emit('toggle-noise')"
    >
      {{ isActive ? 'Stop' : 'Start' }} Noise Watcher
    </button>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="enableNoiseReactions"
        @change="
          emit(
            'update:enableNoiseReactions',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      Enable Noise Reactions
    </label>

    <label class="control-input">
      Threshold
      <input
        type="range"
        min="0"
        max="0.2"
        step="0.001"
        :value="noiseThreshold"
        @input="onThresholdInput($event)"
      />
      <span class="value">{{ noiseThreshold }}</span>
    </label>

    <label class="control-input">
      Debounce (ms)
      <input
        type="number"
        min="0"
        :value="noiseDebounceMs"
        @change="onDebounceChange($event)"
      />
    </label>

    <label class="control-checkbox">
      <input
        type="checkbox"
        :checked="noiseSound"
        @change="
          emit('update:noiseSound', ($event.target as HTMLInputElement).checked)
        "
      />
      Play Sound
    </label>

    <div class="error" v-if="error">{{ error }}</div>

    <div class="status" v-if="isActive">
      <span class="status-indicator" /> Listening for noise...
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  NoiseTrackingControlsEmits,
  NoiseTrackingControlsProps,
} from './noise-tracking-controls.types';

defineProps<NoiseTrackingControlsProps>();
const emit = defineEmits<NoiseTrackingControlsEmits>();

function onThresholdInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  emit('update:noiseThreshold', Number(v));
}

function onDebounceChange(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  emit('update:noiseDebounceMs', Number(v));
}
</script>

<script lang="ts">
export default {
  name: 'NoiseTrackingControls',
};
</script>

<style scoped>
.noise-tracking-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.control-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.value {
  font-weight: 600;
  margin-left: 8px;
}

.control-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-button {
  padding: 8px 16px;
  background: #1f7acb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: #d32f2f;
  padding: 8px;
  background: #fff0f0;
  border-radius: 4px;
}
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32;
}
.status-indicator {
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
}
</style>
