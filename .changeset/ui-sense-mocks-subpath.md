---
'@opentask/ui-sense': minor
---

Exporta os mocks em `@opentask/ui-sense/mocks`.

O subpath nao existia no `exports`, e o `design-vue` compensava com um
`ui-sense-mocks.d.ts` escrito a mao declarando o modulo. O `.gitignore` do repo
engole todo `.d.ts` sob `src/`, entao esse arquivo nunca podia ser versionado:
resolvia na maquina de quem o escreveu e derrubava o build no CI com
`Cannot find module '@opentask/ui-sense/mocks'`.

Os mocks passam a ser entrada propria do build (`dist/mocks.js`), com tipos em
`dist/src/mocks/index.d.ts`, e o shim foi removido.
