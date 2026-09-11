---
'@opentask/ui-sense': minor
---

A camera fora de contexto seguro passa a dizer o que houve

Abrir qualquer uma das telas de tracking por um endereco que nao seja `https://`
nem `localhost` — o IP da rede local, tipicamente, quando se quer testar do
celular — quebrava com `TypeError: Cannot read properties of undefined (reading
'getUserMedia')`. A mensagem nao menciona camera, permissao nem origem, e manda
quem le procurar defeito no lugar errado: o navegador simplesmente nao define
`navigator.mediaDevices` fora de contexto seguro.

`requestMediaStream` e `describeMediaUnavailability` entram em
`@opentask/ui-sense` e a checagem passa a ser feita antes da chamada, com a
causa por extenso e a origem atual no texto. `useFaceLandmarker`,
`useGestureRecognizer`, `usePoseLandmarker` e `createNoiseWatcher` passam a usar
as duas, entao a mensagem e a mesma nos quatro.

`describeMediaUnavailability` e exportada separada para que a UI possa avisar
antes de o usuario clicar em "ligar a camera", em vez de so depois da falha.

O `lib.dom` declara `navigator.mediaDevices` como sempre presente, o que tornava
a checagem invisivel para o compilador; o cast para `MediaDevices | undefined`
agora mora em um lugar so.
