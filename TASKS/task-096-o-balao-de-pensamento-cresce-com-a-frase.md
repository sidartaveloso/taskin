# 🧩 Task 096 — o balao de pensamento cresce com a frase

- Status: done
- Type: fix
- Assignee: Sidarta Veloso

## Description
O balao e uma elipse de rx 35 com um text de 24px, e text em SVG nao quebra linha: Bruno, Shhhhhhhhhhhh... vaza por fora. O layout passa a ser calculado a partir da frase — quebra em linhas, ajuste de fonte e elipse dimensionada pelo conteudo, sem sair do viewBox nem cobrir a cabeca do mascote.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

- [x] Testes do layout antes do código, como função pura: geometria do balão padrão inalterada, quebra em linhas, palavra longa partida, texto nunca perdido, balão dentro do quadro e fora da cabeça, linhas centradas
- [x] `thought-bubble-layout.ts` — quebra por palavras, fonte de 24px a 11px, elipse dimensionada pelo conteúdo
- [x] `TaskinEffectThoughtBubble` desenha uma `<tspan>` por linha e usa a geometria calculada
- [x] As duas bolhas da ponta acompanham o balão em vez de ficarem fixas
- [x] Stories com a frase longa, a palavra única longa e o caso extremo
- [x] Changeset
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### A causa
`<text>` em SVG não quebra linha. O balão era `<ellipse rx="35">` com um
`<text font-size="24">` de uma linha só, então "Bruno, Shhhhhhhhhhhh..." (23
caracteres, ~150 unidades de largura) era desenhado inteiro por cima e por fora
do balão de 70 unidades.

### Evidência
- **Layout puro**: `thought-bubble-layout.ts`, com 12 testes em
  `thought-bubble-layout.spec.ts`. É função pura de propósito: medir texto de
  verdade exigiria o DOM, e a estimativa por contagem de caracteres
  (0.55em por glifo) mantém o cálculo testável sem navegador.
- **Componente**: quatro testes novos em `TaskinEffectThoughtBubble.spec.ts` —
  uma `<tspan>` por linha, a elipse crescendo, as bolhas da ponta acompanhando.
- **Stories**: `LongPhrase`, `SingleLongWord` e `VeryLongPhrase` em
  `Molecules/Taskin/Effects/ThoughtBubble`.
- **Verificação**: `pnpm lint`, `pnpm format`, `pnpm typecheck` (27/27) e
  `pnpm test` (42/42) verdes.

### Duas decisões
**Diminuir a fonte antes de partir palavra.** Com 24px a frase até caberia em
três linhas, mas só cortando "Shhhhhhhhhhhh" no meio. A mesma frase a 16px cabe
em duas linhas inteiras e se lê muito melhor. Partir palavra ficou como último
recurso, para o caso de uma palavra única maior que a linha.

**Crescer para a direita.** O balão fica à direita da cabeça do mascote; crescer
simetricamente o faria cobrir a cabeça. O limite esquerdo é 150 no `viewBox` de
320, e um teste percorre quatro frases conferindo que o balão fica entre os
limites.

### Um defeito que o teste existente pegou
Com o texto dividido em `<tspan>`, o espaço da quebra sumia do conteúdo:
"Bruno,Shhhhhhhhhhhh..." para quem copia ou usa leitor de tela. A linha quebrada
num espaço passou a guardar esse espaço no fim — o SVG não desenha espaço em fim
de linha, então não custa nada visualmente, e `linhas.join('')` volta a
reconstruir a frase.
