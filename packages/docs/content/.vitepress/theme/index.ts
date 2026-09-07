import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
// A CSS do design system nao vem junto do JS: sem estes dois imports os
// estilos com `scoped` nao aplicam. Foi o que fez o `WebcamVideo` aparecer como
// um retangulo branco de 320x240 no lugar de ficar oculto — o `display: none`
// dele mora aqui.
import '@opentask/taskin-design-vue/style.css';
import '@opentask/ui-sense/style.css';
import './custom.css';
import Layout from './Layout.vue';
import MascotTrackingDemo from './MascotTrackingDemo.vue';

/**
 * Tema do site: o layout padrao do vitepress com o mascote de verdade no hero.
 *
 * O mascote e o componente `Taskin` do design system, nao uma imagem — assim o
 * site nunca mostra uma versao velha dele. Foi o que aconteceu na primeira
 * tentativa desta pagina, que usou um `taskin.svg` estatico (o mascote antigo).
 */
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Usado no corpo do index.md, onde ha largura para os controles de tracking
    app.component('MascotTrackingDemo', MascotTrackingDemo);
  },
} satisfies Theme;
