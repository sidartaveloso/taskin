<template>
  <div class="wizard-card">
    <div class="wizard-steps">
      <div
        class="step-dot"
        v-for="i in 4"
        :key="i"
        :class="{ active: step >= i, done: step > i }"
      />
    </div>

    <div class="wizard-body" v-if="wizardState === 'IDLE'">
      <div class="wizard-icon">
        🖐️
      </div>
      <p class="hint">
        Mantenha a mão aberta para configurar atalhos por gestos
      </p>
    </div>

    <div class="wizard-body" v-else-if="wizardState === 'READY'">
      <div class="wizard-icon pulse">
        🖐️
      </div>
      <p class="title">
        Modo de configuração
      </p>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{
            width: Math.min(100, ((readyProgress - 2000) / 3000) * 100) + '%',
          }"
        />
      </div>
      <p class="hint">
        Mantenha a mão aberta para iniciar ({{
          Math.max(0, Math.ceil((5000 - readyProgress) / 1000))
        }}s)
      </p>
      <p class="hint-cancel">
        Solte a mão para cancelar
      </p>
    </div>

    <div class="wizard-body" v-else-if="wizardState === 'RECORDING'">
      <div class="wizard-icon">
        ✋
      </div>
      <p class="title">
        Passo 1: Escolha o gesto
      </p>
      <p class="hint">
        Faça o gesto que será o atalho e mantenha por 1 segundo
      </p>
      <div class="gesture-preview" v-if="recordingCandidate">
        <span class="preview-emoji">{{ gestureEmoji[recordingCandidate] }}</span>
        <span class="preview-label">{{ gestureLabel[recordingCandidate] }}</span>
      </div>
    </div>

    <div class="wizard-body" v-else-if="wizardState === 'SELECTING'">
      <div class="wizard-icon">
        ⚙️
      </div>
      <p class="title">
        Passo 2: Escolha a ação
      </p>
      <div class="action-list">
        <div
          class="action-item"
          v-for="(action, i) in availableActions"
          :key="action"
          :class="{ highlighted: i === selectedActionIndex }"
        >
          <span class="arrow" v-if="i === selectedActionIndex">▶</span>
          <span class="arrow placeholder" v-else />
          <span>{{ actionLabel[action] }}</span>
        </div>
      </div>
      <div class="wizard-legend">
        <span>👍 próx.</span>
        <span>👎 ant.</span>
        <span>✊ selec.</span>
        <span>🖐️ canc.</span>
      </div>
    </div>

    <div class="wizard-body" v-else-if="wizardState === 'CONFIRMING'">
      <div class="wizard-icon">
        ✅
      </div>
      <p class="title">
        Passo 3: Confirmar
      </p>
      <div class="confirm-pair">
        <div class="confirm-item">
          <span class="confirm-emoji">{{ gestureEmoji[lastMapping?.gesture || 'None'] }}</span>
          <span>{{ gestureLabel[lastMapping?.gesture || 'None'] }}</span>
        </div>
        <div class="confirm-arrow">
          →
        </div>
        <div class="confirm-item">
          <span class="confirm-label">{{ actionLabel[lastMapping?.action || 'none'] }}</span>
        </div>
      </div>
      <div class="wizard-legend">
        <span>✊ confirmar</span>
        <span>🖐️ cancelar</span>
      </div>
    </div>

    <div class="wizard-body" v-else-if="wizardState === 'SAVED'">
      <div class="wizard-icon success">
        ✨
      </div>
      <p class="title">
        Atalho salvo!
      </p>
      <div class="confirm-pair">
        <div class="confirm-item">
          <span class="confirm-emoji">{{ gestureEmoji[lastMapping?.gesture || 'None'] }}</span>
          <span>{{ gestureLabel[lastMapping?.gesture || 'None'] }}</span>
        </div>
        <div class="confirm-arrow">
          →
        </div>
        <div class="confirm-item">
          <span class="confirm-label">{{ actionLabel[lastMapping?.action || 'none'] }}</span>
        </div>
      </div>
    </div>

    <div class="wizard-error" v-if="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GestureWizardProps } from './gesture-wizard.types';
import { gestureEmoji, gestureLabel, actionLabel } from './gesture-wizard.types';

defineProps<GestureWizardProps>();
</script>

<script lang="ts">
export default {
  name: 'GestureWizardCard',
};
</script>

<style scoped>
.wizard-card {
  background: #1a1a2e;
  color: #fff;
  border-radius: 24px;
  padding: 32px 40px;
  min-width: 360px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wizard-steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.step-dot.active {
  background: #4fc3f7;
  box-shadow: 0 0 8px #4fc3f7;
}

.step-dot.done {
  background: #66bb6a;
}

.wizard-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.wizard-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 8px;
}

.wizard-icon.pulse {
  animation: pulseGlow 1s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 4px #4fc3f7); }
  50% { filter: drop-shadow(0 0 16px #4fc3f7); }
}

.wizard-icon.success {
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes popIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.hint-cancel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.progress-track {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #66bb6a);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.gesture-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 8px;
}

.preview-emoji {
  font-size: 32px;
}

.preview-label {
  font-size: 16px;
  font-weight: 600;
}

.action-list {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.6);
}

.action-item.highlighted {
  background: rgba(79, 195, 247, 0.2);
  color: #fff;
  font-weight: 600;
}

.arrow {
  width: 16px;
  text-align: center;
  color: #4fc3f7;
}

.arrow.placeholder {
  visibility: hidden;
}

.wizard-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

.confirm-pair {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.confirm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.confirm-emoji {
  font-size: 28px;
}

.confirm-arrow {
  font-size: 20px;
  color: #4fc3f7;
}

.wizard-error {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 8px;
  font-size: 13px;
  color: #ef5350;
  width: 100%;
  text-align: center;
}
</style>
