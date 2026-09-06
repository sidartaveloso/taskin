<template>
  <div class="tracking-controls">
    <div class="primary-row">
      <button
        class="control-button"
        :disabled="disabled"
        @click="emit('toggle-tracking')"
      >
        {{ isDetecting ? 'Parar' : 'Iniciar' }} Detecção
      </button>

      <div class="status" v-if="isDetecting">
        <span class="status-indicator" />
        Detectando...
      </div>
    </div>

    <fieldset class="control-group" v-if="displayControls.length">
      <legend class="control-group__legend">Exibição</legend>

      <label
        class="control-checkbox"
        v-for="control in displayControls"
        :key="control"
      >
        <input
          type="checkbox"
          :checked="DESCRIPTORS[control].checked()"
          @change="onToggle(control, $event)"
        />
        {{ DESCRIPTORS[control].label }}
      </label>
    </fieldset>

    <fieldset class="control-group" v-if="syncControls.length">
      <legend class="control-group__legend">Sincronizar</legend>

      <label
        class="control-checkbox"
        v-for="control in syncControls"
        :key="control"
      >
        <input
          type="checkbox"
          :checked="DESCRIPTORS[control].checked()"
          @change="onToggle(control, $event)"
        />
        {{ DESCRIPTORS[control].label }}
      </label>
    </fieldset>

    <p class="error" role="alert" v-if="error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TrackingControl, TrackingControlsEmits, TrackingControlsProps } from './TrackingControls.types';
import { TRACKING_CONTROLS } from './TrackingControls.types';

const props = withDefaults(defineProps<TrackingControlsProps>(), {
  showWebcam: true,
  syncGestures: true,
  controls: () => TRACKING_CONTROLS,
});

const emit = defineEmits<TrackingControlsEmits>();

type ControlGroup = 'display' | 'sync';

interface ControlDescriptor {
  group: ControlGroup;
  label: string;
  checked: () => boolean;
  emit: (value: boolean) => void;
}

/*
 * Um descritor por controle, em vez de seis blocos quase iguais no template.
 * O `emit` e uma funcao por controle de proposito: chamar `emit(nomeVariavel)`
 * nao passa pelas assinaturas de `TrackingControlsEmits`, e a alternativa seria
 * um cast — que e justamente onde um evento errado passaria despercebido.
 */
const DESCRIPTORS: Record<TrackingControl, ControlDescriptor> = {
  webcam: {
    group: 'display',
    label: 'Webcam',
    checked: () => props.showWebcam,
    emit: (value) => emit('update:showWebcam', value),
  },
  eyes: {
    group: 'sync',
    label: 'Olhos',
    checked: () => props.syncEyes,
    emit: (value) => emit('update:syncEyes', value),
  },
  mouth: {
    group: 'sync',
    label: 'Boca',
    checked: () => props.syncMouth,
    emit: (value) => emit('update:syncMouth', value),
  },
  expressions: {
    group: 'sync',
    label: 'Expressões',
    checked: () => props.syncExpressions,
    emit: (value) => emit('update:syncExpressions', value),
  },
  arms: {
    group: 'sync',
    label: 'Braços',
    checked: () => props.syncArms,
    emit: (value) => emit('update:syncArms', value),
  },
  gestures: {
    group: 'sync',
    label: 'Gestos',
    checked: () => props.syncGestures,
    emit: (value) => emit('update:syncGestures', value),
  },
};

/** Os pedidos, na ordem canonica — nao na ordem em que vieram. */
const available = computed(() => TRACKING_CONTROLS.filter((control) => props.controls.includes(control)));

const displayControls = computed(() => available.value.filter((c) => DESCRIPTORS[c].group === 'display'));
const syncControls = computed(() => available.value.filter((c) => DESCRIPTORS[c].group === 'sync'));

const onToggle = (control: TrackingControl, event: Event): void => {
  DESCRIPTORS[control].emit((event.target as HTMLInputElement).checked);
};
</script>

<script lang="ts">
export default {
  name: 'TrackingControls',
};
</script>

<style scoped>
/*
 * Tudo em token do proprio pacote (`src/styles/variables.css`). O componente
 * usava hex fixos (#1f7acb, #f5f5f5, #d32f2f) que nem batiam com a paleta —
 * #1f7acb esta perto, mas nao e, o `--status-progress-bg`.
 */
.tracking-controls {
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

/* A acao primaria e o status dela andam juntos: o status descreve o botao. */
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

/* O anel de foco e o mesmo em botao e chip: um alvo so de teclado. */
.control-button:focus-visible,
.control-checkbox:focus-within {
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

/*
 * `fieldset`/`legend` agrupam de verdade: separam "o que exibir" de "o que
 * sincronizar", que antes eram uma fila unica de seis caixas iguais, e dao a
 * um leitor de tela o contexto do grupo.
 */
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

/* Marcado muda fundo, borda e peso — nao so a caixinha de 13px. */
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

.status {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--bg-section-light);
  border-radius: var(--radius-xl);
  /*
   * O verde fica no ponto, nao no texto: `--text-success` da 3.62 sobre este
   * fundo e reprova o AA. Assim a cor continua sinalizando e a leitura nao
   * depende dela.
   */
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
  /* Mesma razao do status: o vermelho vive na borda, o texto e legivel. */
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
