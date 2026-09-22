<script setup lang="ts">
import { TASKIN_MOODS, Taskin } from '@opentask/taskin-design-vue';

/**
 * A fileira com todos os humores do Taskin, logo abaixo do hero.
 *
 * A lista vem do design system em tempo de execucao (`TASKIN_MOODS`), e nao
 * escrita aqui: acrescentar um humor novo ao mascote faz ele aparecer na landing
 * sozinho, sem ninguem lembrar de vir editar este arquivo.
 *
 * `idleAnimation` ligado e o que da vida — cada mascote pisca ou mexe os
 * tentaculos num intervalo proprio, entao a fileira nunca esta parada nem em
 * sincronia. Rastreamento de olhar fica de fora de proposito: dezessete
 * instancias ouvindo o mouse e caro, e o hero ja tem um mascote que segue o
 * cursor.
 */
</script>

<template>
  <ClientOnly>
    <section class="mural" aria-label="Os humores do Taskin">
      <Taskin
        v-for="mood in TASKIN_MOODS"
        :key="mood"
        class="mural__humor"
        :mood="mood"
        :size="72"
        :idle-animation="true"
        :aria-label="mood"
        :title="mood"
      />
    </section>
  </ClientOnly>
</template>

<style scoped>
.mural {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 4px 12px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 8px 24px 40px;
}

.mural__humor {
  /* O SVG tem folga em volta do desenho; o recuo negativo aproxima os vizinhos
     sem encostar um no outro. */
  margin: -6px;
  transition: transform 0.2s ease;
}

.mural__humor:hover {
  transform: translateY(-6px) scale(1.08);
}

@media (max-width: 640px) {
  .mural {
    gap: 2px 6px;
    padding: 4px 16px 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mural__humor {
    transition: none;
  }
  .mural__humor:hover {
    transform: none;
  }
}
</style>
