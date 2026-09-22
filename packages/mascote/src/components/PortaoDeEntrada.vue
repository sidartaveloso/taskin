<script setup lang="ts">
/**
 * A tela que aparece antes de tudo, com um botao so.
 *
 * Nao e decoracao nem tela de carregamento: e o **gesto do usuario** de que o
 * navegador precisa para liberar tres coisas de uma vez — o audio (que nao toca
 * sem interacao), a camera e o microfone (que pedem permissao), e a trava de
 * tela (que so e concedida apos interacao). Um toque, e o resto do dia o
 * mascote so trabalha.
 */
defineProps<{ ocupado?: boolean; erro?: string }>();
defineEmits<{ comecar: [] }>();
</script>

<template>
  <div class="portao">
    <div class="portao__conteudo">
      <h1 class="portao__titulo">Taskin</h1>
      <p class="portao__texto">
        Apoie o celular abaixo do monitor, virado para você. Ele acompanha seu rosto e pede silêncio quando a sala
        fica alta.
      </p>

      <button class="portao__botao" type="button" :disabled="ocupado" @click="$emit('comecar')">
        {{ ocupado ? 'Preparando…' : 'Começar' }}
      </button>

      <p class="portao__aviso">
        Um toque libera o som, a câmera e o microfone, e mantém a tela acesa. Nada sai do aparelho.
      </p>

      <p v-if="erro" class="portao__erro" role="alert">{{ erro }}</p>
    </div>
  </div>
</template>

<style scoped>
.portao {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--mascote-fundo);
}

.portao__conteudo {
  max-width: 28rem;
  text-align: center;
}

.portao__titulo {
  margin: 0 0 12px;
  font-size: 2.5rem;
  letter-spacing: -0.02em;
}

.portao__texto {
  margin: 0 0 28px;
  font-size: 1.05rem;
  line-height: 1.5;
  opacity: 0.8;
}

.portao__botao {
  min-width: 12rem;
  /* Alvo generoso: quem toca nisto esta com o celular apoiado numa mesa. */
  padding: 16px 32px;
  border: none;
  border-radius: 999px;
  background: var(--mascote-acento);
  color: var(--mascote-acento-texto);
  font: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.portao__botao:disabled {
  opacity: 0.6;
  cursor: default;
}

.portao__aviso {
  margin: 20px 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
  opacity: 0.6;
}

.portao__erro {
  margin: 16px 0 0;
  color: var(--mascote-erro);
  font-size: 0.9rem;
}
</style>
