---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': patch
---

A barra de tracking so oferece o que a tela implementa

O `TrackingControls` tinha `controls` opcional com "todos" por default, e o
default era o defeito: quem esquecia a prop anunciava os seis interruptores, e
os que a tela nao ligava em nada ficavam la, clicaveis e inertes. A tela do
"shhh", que so le rosto e ruido, mostrava **Arms**; a de priorizacao mostrava
Eyes, Mouth, Expressions, Arms e Gestures com nenhum deles conectado. Nas
stories o disfarce era passar `syncEyes: false` — o que desenha a caixa
desmarcada, sem handler, e ela nao reage ao clique.

Duas mudancas de contrato:

- **`controls` passou a ser obrigatorio.** Sem default, declarar o que a tela faz
  deixa de ser lembrete e vira erro de compilacao, inclusive dentro de template
  `.vue`. Uma tela nova nasce tendo que responder a pergunta.
- **`gestures` saiu de `TRACKING_CONTROLS`**, junto com a prop `syncGestures` e o
  evento `update:syncGestures`. Nenhuma tela ligava esse controle a coisa
  alguma — os gestos da tela de priorizacao vivem no `GestureSystem`, que tem o
  proprio ciclo de vida. Ele volta quando houver quem o implemente.

Quem usa o componente precisa passar `controls` com a lista do que de fato
sincroniza. As telas do `@opentask/taskin-design-vue` ja foram ajustadas: o
"shhh" declara `['webcam', 'eyes', 'mouth', 'expressions']`, a de priorizacao
`['webcam']`, e cada story de atomo declara so o seu (`['webcam', 'arms']` no
`TaskinArms`, `['webcam', 'mouth']` no `TaskinMouth`, e assim por diante).
