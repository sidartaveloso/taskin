---
'@opentask/taskin-design-vue': minor
---

Atomo novo `SpeechBubble`: o balao de fala do `TaskinSays`, reutilizavel. Texto
ou slot, rabicho a esquerda, a direita ou nenhum, e fundo, borda, texto,
espessura, fonte, raio e largura por props, ou pelas variaveis
`--speech-bubble-*` de quem envolve. O rabicho cresce com a borda e a junta
com ela fica continua em qualquer espessura. O `TaskinSays` passa a usa-lo e
ganha as props `bubbleBackground`, `bubbleBorderColor`, `bubbleTextColor`,
`bubbleBorderWidth` e `bubbleFontSize`; as variaveis `--taskin-says-*` saem.
