---
'@opentask/taskin-design-vue': minor
---

Os baloes dos quadrinhos: a prop `kind` do `SpeechBubble` escolhe a forma pelo
jeito de falar — `speech` (fala), `shout` (grito, contorno em estrela e texto
em negrito), `whisper` (sussurro, tracejado e em italico), `thought`
(pensamento, nuvem com bolinhas) e `narration` (narracao, caixa reta e
amarelada, sem rabicho). O grito e a nuvem sao desenhados no tamanho medido
do balao, com a ponta no mesmo lugar do rabicho de fala; as formas saem de
funcoes puras exportadas (`shoutOutline`, `thoughtCloud`, `tailAnchor`). O
`TaskinSays` ganha `bubbleKind`. O balao passa a abracar o texto.
