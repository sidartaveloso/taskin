---
'@opentask/taskin-design-vue': patch
---

O contraste do texto no grito e no pensamento do `SpeechBubble` fica
mensuravel pelo axe (o painel de acessibilidade do Storybook o dava como
inconclusivo): o texto leva o proprio fundo, da cor do balao, e fica por cima
do SVG da forma por `z-index` positivo. O desenho nao muda.
