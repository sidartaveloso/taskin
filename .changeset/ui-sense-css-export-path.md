---
'@opentask/ui-sense': patch
---

Corrige o caminho da folha de estilos: `@opentask/ui-sense/style.css` não
resolvia para arquivo nenhum.

Os `exports` do pacote declaram `./style.css` e `./dist/index.css` apontando
para `./dist/index.css`, mas o build emitia **`dist/ui-sense.css`**. Com
múltiplas entradas (`index` e `mocks`), o Vite nomeia o CSS pelo `lib.name`
(`UiSense`) em vez do `fileName`, e ninguém percebeu porque dentro do monorepo o
Storybook compila a partir do fonte, com os `<style scoped>` inline.

Fora do monorepo o efeito é silencioso e confuso: o import falha ou é omitido, os
componentes montam sem estilo, e o `WebcamVideo` — cujo `display: none` mora
justamente nessa folha — aparece como um retângulo branco de 320x240 em vez de
ficar oculto. Foi assim que o problema apareceu, ao montar o
`TaskinWithFaceTracking` no site de documentação.

`build.lib.cssFileName: 'index'` alinha a saída ao caminho já publicado, então
`@opentask/ui-sense/style.css` passa a resolver sem mudar a API.

Quem consome precisa importar a folha explicitamente — ela não vem junto do JS:

```ts
import '@opentask/ui-sense/style.css';
```
