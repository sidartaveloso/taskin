<script setup lang="ts">
import type { MascotNoiseSettings } from '@opentask/taskin-types';
import { reactive, watch } from 'vue';

/**
 * Os ajustes que se mexe uma vez e não se olha mais.
 *
 * Fica fechada por padrão: durante o dia o aparelho mostra só o mascote. O que
 * se edita aqui é exatamente o bloco `mascot.reactions.noise` — os mesmos
 * campos, com os mesmos nomes, para o que se aprende no celular servir no
 * `.taskin.json` e vice-versa.
 */
const props = defineProps<{ ajustes: MascotNoiseSettings; trancaAtiva: boolean; motivoDaTranca: string }>();
const emit = defineEmits<{ atualizar: [MascotNoiseSettings]; fechar: [] }>();

const rascunho = reactive({ ...props.ajustes });

watch(
  () => props.ajustes,
  (novos) => Object.assign(rascunho, novos),
);

const aplicar = () => emit('atualizar', { ...rascunho });
</script>

<template>
  <div class="gaveta" role="dialog" aria-label="Ajustes do mascote">
    <header class="gaveta__topo">
      <h2 class="gaveta__titulo">Ajustes</h2>
      <button class="gaveta__fechar" type="button" aria-label="Fechar ajustes" @click="emit('fechar')">✕</button>
    </header>

    <label class="campo campo--linha">
      <input v-model="rascunho.enabled" type="checkbox" @change="aplicar" />
      <span>Reagir a barulho</span>
    </label>

    <label class="campo">
      <span class="campo__rotulo">Quem chamar</span>
      <input v-model="rascunho.name" type="text" placeholder="Bruno" @change="aplicar" />
      <small>Ele fala o nome, faz a pausa, e só então chia. Em branco, só chia.</small>
    </label>

    <label class="campo">
      <span class="campo__rotulo">O que aparece no balão</span>
      <input v-model="rascunho.phrase" type="text" @change="aplicar" />
      <small>Mais <code>h</code>, mais chiado: a duração acompanha a frase.</small>
    </label>

    <label class="campo campo--linha">
      <input v-model="rascunho.sound" type="checkbox" @change="aplicar" />
      <span>Falar em voz alta</span>
    </label>

    <label class="campo">
      <span class="campo__rotulo">Volume · {{ Math.round(rascunho.volume * 100) }}%</span>
      <input v-model.number="rascunho.volume" type="range" min="0" max="1" step="0.05" @change="aplicar" />
    </label>

    <label class="campo">
      <span class="campo__rotulo">Sensibilidade · {{ rascunho.threshold.toFixed(2) }}</span>
      <input v-model.number="rascunho.threshold" type="range" min="0.01" max="0.5" step="0.01" @change="aplicar" />
      <small>Menor dispara com menos barulho.</small>
    </label>

    <label class="campo">
      <span class="campo__rotulo">Insistência · {{ (rascunho.sustainMs / 1000).toFixed(1) }}s</span>
      <input v-model.number="rascunho.sustainMs" type="range" min="0" max="10000" step="500" @change="aplicar" />
      <small>Quanto tempo o barulho precisa durar. Zero dispara num estalo de porta.</small>
    </label>

    <p class="gaveta__tranca" :class="{ 'gaveta__tranca--fria': !trancaAtiva }">
      {{ trancaAtiva ? 'Tela sendo mantida acesa.' : motivoDaTranca || 'Tela livre para apagar.' }}
    </p>
  </div>
</template>

<style scoped>
.gaveta {
  position: fixed;
  inset: auto 0 0 0;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: var(--mascote-gaveta);
  box-shadow: 0 -8px 40px rgb(0 0 0 / 35%);
}

.gaveta__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.gaveta__titulo {
  margin: 0;
  font-size: 1.2rem;
}

.gaveta__fechar {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.campo {
  display: block;
  margin: 18px 0;
}

.campo--linha {
  display: flex;
  align-items: center;
  gap: 12px;
}

.campo__rotulo {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.campo input[type='text'] {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--mascote-borda);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
}

.campo input[type='range'] {
  width: 100%;
}

.campo input[type='checkbox'] {
  width: 22px;
  height: 22px;
}

.campo small {
  display: block;
  margin-top: 6px;
  font-size: 0.78rem;
  line-height: 1.4;
  opacity: 0.6;
}

.gaveta__tranca {
  margin: 20px 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.gaveta__tranca--fria {
  color: var(--mascote-erro);
}
</style>
