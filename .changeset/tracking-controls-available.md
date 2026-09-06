---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': patch
---

`TrackingControls` passa a aceitar quais controles ficam disponiveis.

A barra mostrava os seis controles sempre, em qualquer tela. O
`TaskinWithFaceTracking` nao tem pose nem reconhecimento de gestos, e mesmo
assim exibia "Braços" e "Gestos" — interruptores que nao ligavam coisa alguma. O
`TaskinWithFullTracking` contornava passando `:sync-expressions="false"`, que
desliga o valor mas continua mostrando o controle.

A prop nova e `controls?: readonly TrackingControl[]`, com todos como default.
Os dois organismos passaram a declarar o que suportam, e o contorno do
`sync-expressions` saiu.

A ordem e a canonica do componente, nao a do array recebido: a barra aparece em
telas diferentes e deve ter sempre o mesmo layout, entao pedir
`['gestures', 'eyes']` esconde o resto sem embaralhar o que sobrou. Um grupo sem
nenhum item disponivel desaparece inteiro, em vez de virar uma moldura vazia.

Por dentro, os seis blocos quase iguais do template viraram um descritor por
controle com `v-for`. O `emit` de cada descritor e uma funcao propria de
proposito: chamar `emit(nomeVariavel)` nao passa pelas assinaturas de
`TrackingControlsEmits`, e a alternativa seria um cast — justamente onde um
evento errado passaria despercebido.
