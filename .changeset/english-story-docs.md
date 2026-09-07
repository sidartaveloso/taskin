---
'@opentask/ui-sense': patch
'@opentask/taskin-design-vue': patch
---

Traduz para ingles a documentacao das stories.

Os 22 arquivos de story com texto em portugues passaram a ingles: as descricoes
de componente e de story, os blocos JSDoc (que o Storybook renderiza como
descricao da story, e portanto sao documentacao, nao comentario), as fixtures com
frase em portugues e o texto dos exemplos interativos.

Inclui as paginas mais longas — `GestureWizard` e `GestureSystem`, com a
explicacao de atalho por gesto e as areas de aplicacao, e as duas de tracking
completo, com requisitos e passo a passo.

Corrigidas de carona quatro referencias a `"Iniciar Detecção"` dentro de textos
que ja estavam em ingles: o botao foi renomeado para `Start Detection` e a
documentacao apontava para um rotulo que nao existe mais.

Continuam em portugues, de proposito: os comentarios `//` de codigo, que o
Storybook nao renderiza e que seguem a convencao do repositorio, e os nomes de
pessoa nas fixtures — nome nao se traduz.
