import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, type PluginOption } from 'vite';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      svgoConfig: {
        multipass: true,
      },
    }) as PluginOption,
  ],
  build: {
    lib: {
      // Os mocks saem como entrada propria para o pacote poder exporta-los em
      // `./mocks`. Sem isso o design-vue precisava de um `.d.ts` escrito a mao
      // declarando o modulo — e o .gitignore engole todo .d.ts sob src, entao
      // resolvia na maquina de quem escreveu e quebrava no CI.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        mocks: resolve(__dirname, 'src/mocks/index.ts'),
      },
      name: 'UiSense',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
