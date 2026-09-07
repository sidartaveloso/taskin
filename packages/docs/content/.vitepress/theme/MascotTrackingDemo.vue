<script setup lang="ts">
import { TaskinWithFaceTracking } from '@opentask/taskin-design-vue';
import { ref } from 'vue';

/**
 * Demo do tracking, montada sob demanda.
 *
 * Fica no corpo da pagina e nao no hero: o `TaskinWithFaceTracking` traz os
 * proprios `TrackingControls` (start, webcam, eyes, mouth, expressions), que
 * nao caberiam na coluna estreita do hero — ali eles sobrepunham o conteudo.
 *
 * O componente nao inicia deteccao ao montar, entao a camera so e pedida quando
 * a pessoa aperta o Start dos controles. Este botao apenas revela o demo.
 */
const enabled = ref(false);
</script>

<template>
  <div class="tracking-demo">
    <button v-if="!enabled" class="tracking-demo__start" type="button" @click="enabled = true">
      ● carregar o demo de tracking
    </button>

    <template v-else>
      <ClientOnly>
        <TaskinWithFaceTracking :mascot-size="240" :show-webcam="false" />
      </ClientOnly>

      <p class="tracking-demo__hint">
        Aperte <strong>Start Detection</strong> para liberar a câmera. A detecção roda
        no próprio navegador; nada sai da sua máquina. Ligue <strong>Webcam</strong> em
        <em>Display</em> se quiser ver o vídeo ao lado.
      </p>

      <button class="tracking-demo__stop" type="button" @click="enabled = false">
        ■ encerrar o demo
      </button>
    </template>
  </div>
</template>

<style scoped>
.tracking-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.tracking-demo__start,
.tracking-demo__stop {
  padding: 0.5rem 1.1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.tracking-demo__start:hover,
.tracking-demo__stop:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tracking-demo__hint {
  max-width: 34rem;
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
  line-height: 1.6;
  text-align: center;
}
</style>
