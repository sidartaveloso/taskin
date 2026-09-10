import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
// A CSS do design system nao vem junto do JS, entao precisa de import
// explicito. Uma folha basta: o `design-vue` inlina a do `ui-sense` no proprio
// bundle, entao os componentes de sensor (TrackingControls, WebcamVideo) vem
// estilizados por esta linha. Sem ela, o `WebcamVideo` aparecia como um
// retangulo branco de 320x240 em vez de ficar oculto.
import '@opentask/taskin-design-vue/style.css';
import './custom.css';
import { initAnalytics } from './analytics';
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

    // `enhanceApp` roda no servidor tambem; o guard de `window` fica dentro do
    // `initAnalytics`. Pageview a cada rota vem do proprio SDK, via
    // `capture_pageview: 'history_change'`.
    initAnalytics('docs');
  },
} satisfies Theme;
