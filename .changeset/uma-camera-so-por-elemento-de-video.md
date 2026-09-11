---
'@opentask/ui-sense': minor
---

Telas com dois landmarkers paravam de travar

O `TaskinWithFullTracking` roda face e pose ao mesmo tempo sobre o mesmo
`<video>`, e cada composable abria a **propria** camera. Duas consequencias, uma
visivel e uma nao:

- o segundo `srcObject` desligava o primeiro stream sem para-lo — camera acesa,
  ninguem lendo;
- e os dois esperavam o video com `videoElement.onloadedmetadata = () => ...`,
  que e **propriedade**, nao lista. A segunda atribuicao apagava a primeira, e
  quem chegou antes ficava preso no `await` para sempre: nunca comecava a
  detectar, sem erro, sem log, so um mascote parado e o painel de debug vazio.
  Qual dos dois travava dependia de quem terminava de carregar o modelo antes,
  o que fazia o defeito ir e vir sem ninguem mudar nada.

Entra `attachCamera(videoElement)` no `@opentask/ui-sense`: abre a camera uma
vez por elemento, conta referencias e devolve uma funcao que solta a sua. A
camera so desliga quando a ultima sai. A espera pelos metadados passou a usar
`addEventListener(..., { once: true })` e volta na hora se eles ja chegaram, e um
`AbortError` de `play()` interrompido — que e o que dois consumidores quase
simultaneos causam — deixa de ser tratado como falha.

`useFaceLandmarker`, `usePoseLandmarker` e `useGestureRecognizer` passam a usar
a funcao. Nenhum deles limpa mais o `srcObject` ao parar: fazer isso derrubava o
video do outro consumidor.
