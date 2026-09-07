<template>
  <div class="noise-tracking-controls">
    <div class="primary-row">
      <button
        class="control-button"
        :disabled="disabled"
        @click="emit('toggle-noise')"
      >
        {{ isActive ? 'Stop' : 'Start' }} Noise Watcher
      </button>

      <div class="status" v-if="isActive">
        <span class="status-indicator" /> Listening for noise...
      </div>
    </div>

    <fieldset class="control-group">
      <legend class="control-group__legend">Reactions</legend>

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
        Enable
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
    </fieldset>

    <fieldset class="control-group control-group--fields">
      <legend class="control-group__legend">Sensitivity</legend>

      <label class="control-field">
        <span class="control-field__label">Threshold</span>
        <input
          class="control-field__range"
          type="range"
          min="0"
          max="0.2"
          step="0.001"
          :value="noiseThreshold"
          @input="onThresholdInput($event)"
        />
        <output class="value">{{ formattedThreshold }}</output>
      </label>

      <label class="control-field">
        <span class="control-field__label">Debounce</span>
        <input
          class="control-field__number"
          type="number"
          min="0"
          step="100"
          :value="noiseDebounceMs"
          @change="onDebounceChange($event)"
        />
        <span class="control-field__unit">ms</span>
      </label>
    </fieldset>

    <p class="error" role="alert" v-if="error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NoiseTrackingControlsEmits, NoiseTrackingControlsProps } from './NoiseTrackingControls.types';

const props = defineProps<NoiseTrackingControlsProps>();
const emit = defineEmits<NoiseTrackingControlsEmits>();

/*
 * Tres casas fixas: o valor vem de um `range` com passo de 0.001, e sem o
 * padding o texto muda de largura a cada arrasto, empurrando o que vem depois.
 */
const formattedThreshold = computed(() => (props.noiseThreshold ?? 0).toFixed(3));

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
/* Mesma linguagem do TrackingControls: tokens do pacote, sem hex fixo. */
.noise-tracking-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.primary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
}

.control-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--status-progress-bg);
  color: var(--status-progress-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.control-button:hover:not(:disabled) {
  background: var(--bg-header-dark);
}

.control-button:disabled {
  background: var(--bg-badge);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.control-button:focus-visible,
.control-checkbox:focus-within,
.control-field:focus-within {
  outline: 2px solid var(--text-link);
  outline-offset: 2px;
}

.control-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
}

.control-group--fields {
  gap: var(--spacing-lg);
}

.control-group__legend {
  padding: 0 var(--spacing-xs);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.control-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-section-light);
  border: 1px solid transparent;
  border-radius: var(--radius-xl);
  cursor: pointer;
  user-select: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.control-checkbox:hover {
  border-color: var(--border-muted);
}

.control-checkbox:has(input:checked) {
  background: var(--bg-progress);
  border-color: var(--text-muted);
  color: var(--text-link);
  font-weight: var(--font-weight-medium);
}

.control-checkbox input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--status-progress-bg);
  cursor: pointer;
}

/*
 * Os dois numericos ficam numa linha so, com rotulo, controle e valor lado a
 * lado. Antes o "Threshold" empilhava rotulo, slider e numero em tres linhas
 * dentro de uma fila horizontal, desalinhando tudo o que vinha depois.
 */
.control-field {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.control-field__label {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.control-field__range {
  width: 120px;
  accent-color: var(--status-progress-bg);
  cursor: pointer;
}

/*
 * Sem largura o `number` estica sozinho e domina a barra; com pouca demais os
 * spinners comem o texto e "1500" aparece cortado. 8ch cabe cinco digitos mais
 * a seta.
 */
.control-field__number {
  width: 8ch;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: right;
}

.control-field__unit {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.value {
  min-width: 4.5ch;
  padding: 2px var(--spacing-sm);
  background: var(--bg-section-light);
  border-radius: var(--radius-sm);
  color: var(--text-link);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--bg-section-light);
  border-radius: var(--radius-xl);
  /* Verde no ponto, nao no texto: `--text-success` reprova o AA neste fundo. */
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: var(--status-success-bg);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.error {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--text-error-bg);
  border-left: 3px solid var(--text-error-dark);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-indicator {
    animation: none;
  }

  .control-button,
  .control-checkbox {
    transition: none;
  }
}
</style>
