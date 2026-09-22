<script setup lang="ts">
import { Taskin } from '@opentask/taskin-design-vue';
import DefaultTheme from 'vitepress/theme';
import MuralDeHumores from './MuralDeHumores.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <!--
        `ClientOnly` porque o vitepress renderiza no servidor e o mascote depende
        de `window` (cursor, requestAnimationFrame).

        Aqui fica o mascote simples, vivo sem pedir permissao nenhuma: pisca pelo
        `idleAnimation` e segue o cursor pelo `eyeTrackingMode="mouse"`. O demo de
        tracking por webcam mora no corpo da pagina — os `TrackingControls` dele
        nao cabem nesta coluna.
      -->
      <ClientOnly>
        <Taskin :size="300" mood="neutral" :idle-animation="true" eye-tracking-mode="mouse" />
      </ClientOnly>
    </template>

    <!--
      Logo abaixo do hero, antes dos cartoes de recurso: e o topo da pagina, e
      e onde a fileira de humores tem espaco para respirar sem empurrar o
      conteudo. O slot so existe nas paginas `layout: home`, entao os dois
      idiomas ganham o mural sem que nenhum `index.md` precise saber dele.
    -->
    <template #home-hero-after>
      <MuralDeHumores />
    </template>
  </Layout>
</template>

<style scoped>
:deep(.VPHero .image-container) {
  /* O mascote e um SVG proprio; a moldura redonda do vitepress atrapalha */
  background: none;
  transform: none;
}
</style>
