<script setup lang="ts">
import { TaskinWithShhh } from '@opentask/taskin-design-vue';
import type { MascotNoiseSettings } from '@opentask/taskin-types';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import GavetaDeAjustes from './components/GavetaDeAjustes.vue';
import PortaoDeEntrada from './components/PortaoDeEntrada.vue';
import { armazenamentoDoNavegador, blocoDe, gravarAjustes, lerAjustes } from './composables/ajustes';
import { useTrancaDeTela } from './composables/tranca-de-tela';

/**
 * O mascote em tela cheia, para um celular apoiado abaixo do monitor.
 *
 * A aplicacao inteira e uma tela so. O que existe de estrutura aqui e o portao
 * de entrada — o gesto que libera audio, camera, microfone e trava de tela — e
 * uma gaveta de ajustes que fica fechada durante o dia.
 */
const armazenamento = armazenamentoDoNavegador();
const ajustes = ref<MascotNoiseSettings>(lerAjustes(armazenamento));

const comecou = ref(false);
const preparando = ref(false);
const erro = ref('');
const mostrandoAjustes = ref(false);

const tranca = useTrancaDeTela();

/**
 * O tamanho acompanha a menor dimensao da tela: num celular em pe, e a largura
 * que limita. Deixa uma folga para o mascote nao encostar nas bordas.
 */
const lado = ref(320);
const medir = () => {
  if (typeof window === 'undefined') return;
  lado.value = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.82);
};

onMounted(() => {
  medir();
  window.addEventListener('resize', medir);
  window.addEventListener('orientationchange', medir);
});

onUnmounted(() => {
  window.removeEventListener('resize', medir);
  window.removeEventListener('orientationchange', medir);
});

const tamanho = computed(() => lado.value);

/**
 * O unico momento em que o navegador libera o que o mascote precisa. Pedir a
 * trava aqui, e nao depois, e o que garante que ela venha de um gesto.
 */
const comecar = async () => {
  preparando.value = true;
  erro.value = '';
  try {
    await tranca.manter();
    comecou.value = true;
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : String(falha);
  } finally {
    preparando.value = false;
  }
};

const atualizar = (novos: MascotNoiseSettings) => {
  try {
    ajustes.value = gravarAjustes(armazenamento, blocoDe(novos));
    erro.value = '';
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : String(falha);
  }
};
</script>

<template>
  <PortaoDeEntrada v-if="!comecou" :ocupado="preparando" :erro="erro" @comecar="comecar" />

  <main v-else class="palco">
    <!--
      `:key` no bloco de ajustes: o `TaskinWithShhh` semeia os proprios refs a
      partir da configuracao no `setup`, entao mudar o limiar ou o nome so tem
      efeito remontando. Num aparelho que fica ligado o dia inteiro isso
      acontece raramente — so quando alguem abre a gaveta.
    -->
    <TaskinWithShhh
      :key="JSON.stringify(ajustes)"
      :mascot="blocoDe(ajustes)"
      :mascot-size="tamanho"
      :show-controls="false"
      :show-webcam="false"
      :show-debug="false"
    />

    <button class="palco__ajustes" type="button" aria-label="Abrir ajustes" @click="mostrandoAjustes = true">
      ⚙
    </button>

    <GavetaDeAjustes
      v-if="mostrandoAjustes"
      :ajustes="ajustes"
      :tranca-ativa="tranca.ativa.value"
      :motivo-da-tranca="tranca.motivo.value"
      @atualizar="atualizar"
      @fechar="mostrandoAjustes = false"
    />
  </main>
</template>

<style scoped>
.palco {
  display: grid;
  place-items: center;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background: var(--mascote-fundo);
}

.palco__ajustes {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top));
  right: 12px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  /* Discreto de proposito: durante o dia o aparelho mostra o mascote, nao a
     interface em volta dele. */
  background: transparent;
  color: inherit;
  font-size: 1.2rem;
  opacity: 0.25;
  cursor: pointer;
}

.palco__ajustes:hover,
.palco__ajustes:focus-visible {
  opacity: 0.8;
}
</style>
