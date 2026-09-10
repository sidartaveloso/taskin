---
'@opentask/taskin-design-vue': patch
---

A folha de estilos do pacote passa a incluir a do `@opentask/ui-sense`, então um
import basta.

O JS do `ui-sense` já era embutido aqui (ele não está em `external`), mas o CSS
dele é um artefato separado — e ninguém o importava. Quem consumia o design-vue
de fora do monorepo recebia os componentes de sensor **sem estilo**:
`TrackingControls` com botão pelado e checkbox nativo, `NoiseTrackingControls`
sem moldura, e `WebcamVideo` visível como um retângulo de 320x240 em vez de
oculto — o `display: none` dele mora justamente nessa folha.

O sintoma enganava: controle sem estilo parece controle improvisado, então dava a
impressão de que os componentes `TaskinWithFaceTracking`,
`TaskinWithFullTracking` e `TaskinWithShhh` tinham implementação própria de
controles em vez de usar a do `ui-sense`. Sempre usaram a do `ui-sense`.

## O que muda para quem consome

Um import, não dois:

```ts
import '@opentask/taskin-design-vue/style.css';
```

Com `cssCodeSplit: false`, o Vite resolve e inlina as regras do `ui-sense` em
`dist/index.css` (43 KB → 56 KB). Quem também importa
`@opentask/ui-sense/style.css` direto continua funcionando — as regras
duplicadas são idênticas e não têm efeito visual.

## Nota

Dentro do monorepo o Storybook do design-vue precisa do import explícito da
folha do `ui-sense` no `preview.ts`: lá as stories importam os componentes
direto do fonte, não pelo barrel `src/index.ts`, então esta cadeia de `@import`
não se aplica. Nos testes unitários o `vitest.config.ts` faz alias do `ui-sense`
para o fonte e os `<style scoped>` compilam inline, o que é o motivo de o
problema nunca ter aparecido em teste.
