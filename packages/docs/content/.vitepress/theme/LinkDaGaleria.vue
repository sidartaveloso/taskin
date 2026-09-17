<script setup lang="ts">
import { withBase } from 'vitepress';

/**
 * Link para a galeria de componentes, que e o Storybook copiado para dentro da
 * arvore publicada pelo workflow do Pages — nao uma pagina do vitepress.
 *
 * Existe por causa de duas regras que, juntas, nao deixam escrever isto em
 * markdown. O roteador do vitepress intercepta o clique em qualquer ancora
 * interna **sem** `target` e tenta resolver o caminho como rota de markdown: sem
 * o atributo, o clique caia no 404 do proprio site enquanto a URL digitada
 * direto abria a galeria. Mas o plugin de link do markdown so aplica o `base`
 * quando o link **nao** tem `target` (`linkPlugin`, vitepress 1.6.4), entao
 * `[texto](/components/){target="_self"}` sai com `href="/components/"` e perde
 * o `/taskin/`.
 *
 * Aqui os dois convivem: `withBase` resolve o prefixo em tempo de execucao, e o
 * `target` sobrevive porque este HTML nao passa pelo plugin.
 */
</script>

<template>
  <a :href="withBase('/components/')" target="_self"><slot /></a>
</template>
