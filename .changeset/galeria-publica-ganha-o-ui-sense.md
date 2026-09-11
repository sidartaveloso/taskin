---
'@opentask/taskin-design-vue': patch
'@opentask/ui-sense': patch
---

A galeria publicada passa a incluir o `ui-sense`

O deploy buildava so o Storybook do `design-vue`, entao o `ui-sense` nunca chegou
ao site: `WebcamVideo`, `TrackingControls`, `GestureIcon`, `GestureLegend`,
`GestureWizard`, `NoiseTrackingControls`, `FaceTrackingDebug` e `GestureSystem`
existiam apenas na maquina de quem rodasse `storybook` naquele pacote. Agora o
passo builda o Storybook da raiz, que cobre os dois — 46 titulos e 303 stories no
`/components/`, contra 38 titulos antes.

Junto vao tres titulos que estavam errados e so ficaram visiveis com a arvore
unica:

- `TaskinWithFullTracking.stories.ts` e `TaskinWithFullTrackingV2.stories.ts`
  declaravam **o mesmo** `Organisms/Taskin/Full Tracking`, e o Storybook fundia
  os dois no mesmo no. O que sobrevive e o `V2` — o unico que documenta o
  componente, e que assume o nome do arquivo. O outro foi apagado: eram 287
  linhas remontando a fiacao do componente a mao (`h(TrackingControls, ...)`,
  os watchers dos landmarkers, o SVG) em vez de usar o componente, entao ele
  duplicava um interior que ninguem lembraria de atualizar. A task-044 ja tinha
  registrado essa duplicacao.
- `TaskinWithShhh` estava em `Organisms/TaskinWithShhh`, fora do grupo, embora o
  arquivo more em `organisms/taskin/` como os irmaos. Virou
  `Organisms/Taskin/Shhh`.
