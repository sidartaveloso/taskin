---
'@opentask/taskin-design-vue': minor
---

O mascote ganha acoes de uma vez so, alem dos humores em laco: `play(acao)`,
exposto pelo `Taskin`, faz o gesto, devolve o bicho ao humor em que estava e
resolve `true` no fim — ou `false`, se outra acao o interrompe ou a variante
nao a tem. Os eventos `action-start` e `action-end` (`{ action, completed }`)
avisam o comeco e o fim, e `TASKIN_ACTIONS` lista as acoes. As primeiras sao o
sim (`nod`, sorrindo) e o nao (`shake`, de cara fechada), no Taskin e no Sapin.

Com `prefers-reduced-motion: reduce`, o grupo de movimento para, humores e
acoes, e quem espera o fim de uma acao continua recebendo-o no tempo dela.
