---
'@opentask/taskin-types': minor
'@opentask/taskin-design-vue': minor
---

O bloco `mascot.reactions.noise` passa a carregar `sustainMs`, `sustainRatio` e
`name`, e o `TaskinWithShhh` ganha `showControls`.

A sustentação do ruído e o nome de quem chamar existiam como prop do componente
e não no `.taskin.json` — o próprio código dizia isso num comentário, e
contornava lendo da prop mesmo quando recebia o bloco de configuração. Agora as
duas fontes carregam os mesmos campos, e o contorno saiu.

`showControls` desliga os controles de rastreamento e de ruído em volta do
mascote. Ligados seguem sendo o padrão, que é o uso de laboratório; desligados,
sobra só o mascote — que é como ele vive num celular apoiado abaixo do monitor,
onde não há nada a ajustar durante o dia.
