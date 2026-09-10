<script setup lang="ts">
import { TaskinWithFaceTracking } from '@opentask/taskin-design-vue';
import { useData } from 'vitepress';
import { computed, ref } from 'vue';

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

/**
 * O texto acompanha o locale do site.
 *
 * Dicionario local em vez de um pacote de i18n: sao quatro strings num
 * componente do tema, e o `useData().lang` do vitepress ja diz em qual locale a
 * pagina esta.
 */
const { lang } = useData();

const COPY = {
  en: {
    load: '● load the tracking demo',
    stop: '■ end the demo',
    hintBefore: 'Press',
    hintStart: 'Start Detection',
    hintAfter:
      'to allow the camera. Detection runs in the browser itself; nothing leaves your machine. Turn on Webcam under Display if you want to see the video alongside.',
  },
  'pt-BR': {
    load: '● carregar o demo de tracking',
    stop: '■ encerrar o demo',
    hintBefore: 'Aperte',
    hintStart: 'Start Detection',
    hintAfter:
      'para liberar a câmera. A detecção roda no próprio navegador; nada sai da sua máquina. Ligue Webcam em Display se quiser ver o vídeo ao lado.',
  },
} as const;

const copy = computed(() => (lang.value.startsWith('pt') ? COPY['pt-BR'] : COPY.en));
</script>

<template>
  <div class="tracking-demo">
    <button v-if="!enabled" class="tracking-demo__start" type="button" @click="enabled = true">
      {{ copy.load }}
    </button>

    <template v-else>
      <ClientOnly>
        <TaskinWithFaceTracking :mascot-size="240" :show-webcam="false" />
      </ClientOnly>

      <p class="tracking-demo__hint">
        {{ copy.hintBefore }} <strong>{{ copy.hintStart }}</strong> {{ copy.hintAfter }}
      </p>

      <button class="tracking-demo__stop" type="button" @click="enabled = false">
        {{ copy.stop }}
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
