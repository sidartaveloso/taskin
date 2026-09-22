import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * O mascote e publicado junto do site, num subcaminho. HTTPS nao e detalhe de
 * hospedagem aqui: `getUserMedia` e a trava de tela exigem contexto seguro,
 * entao um celular acessando o computador por IP da rede local nao serviria.
 */
export default defineConfig({
  base: '/taskin/mascote/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // A lista de arquivos a pre-cachear sai do proprio build. Escrita a mao,
      // ela envelheceria em silencio a cada arquivo novo.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Taskin — o mascote',
        short_name: 'Taskin',
        description: 'O Taskin olhando para voce e pedindo silencio quando a sala fica alta.',
        lang: 'pt-BR',
        // Instalado na tela inicial, sem barra de endereco: o aparelho fica
        // apoiado e o que se ve e o mascote.
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#14161a',
        theme_color: '#14161a',
        start_url: '/taskin/mascote/',
        scope: '/taskin/mascote/',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
});
