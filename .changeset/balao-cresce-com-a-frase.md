---
'@opentask/taskin-design-vue': patch
---

O balão de pensamento cresce com a frase

`<text>` em SVG não quebra linha, e o balão era uma elipse fixa de `rx: 35` com
uma única linha de 24px. Qualquer frase maior que meia dúzia de caracteres saía
por fora do desenho — e a frase do shhh é configurável justamente para chamar a
pessoa pelo nome, como em "Bruno, Shhhhhhhhhhhh...".

Agora o layout vem do conteúdo: a frase é quebrada em linhas, a fonte cede de
24px até 11px antes de partir qualquer palavra ao meio, e a elipse é
dimensionada pelo texto. O balão cresce para a direita antes da esquerda, para
não cobrir a cabeça do mascote, e nunca ultrapassa o quadro. As duas bolhas da
ponta acompanham o balão em vez de ficarem em posição fixa.

O balão padrão (`?`) continua exatamente onde estava, no mesmo tamanho. A linha
quebrada num espaço guarda esse espaço, para o texto não se emendar para quem
copia ou usa leitor de tela.
