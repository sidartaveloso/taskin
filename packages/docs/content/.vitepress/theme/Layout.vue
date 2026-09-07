<script setup lang="ts">
import { Taskin } from '@opentask/taskin-design-vue';
import DefaultTheme from 'vitepress/theme';

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
  </Layout>
</template>

<style scoped>
:deep(.VPHero .image-container) {
  /* O mascote e um SVG proprio; a moldura redonda do vitepress atrapalha */
  background: none;
  transform: none;
}
</style>
