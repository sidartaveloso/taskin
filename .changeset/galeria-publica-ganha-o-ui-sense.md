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
  os dois no mesmo no. O `V2`, que e o que documenta o componente de verdade,
  fica com o titulo; o outro, que monta a fiacao a mao em vez de usar o
  componente, vira `Organisms/Taskin/Full Tracking Rig`.
- `TaskinWithShhh` estava em `Organisms/TaskinWithShhh`, fora do grupo, embora o
  arquivo more em `organisms/taskin/` como os irmaos. Virou
  `Organisms/Taskin/Shhh`.
