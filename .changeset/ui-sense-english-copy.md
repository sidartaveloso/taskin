---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': patch
---

Padroniza a interface do `ui-sense` em ingles.

O pacote falava duas linguas: o `TrackingControls` estava em portugues e o
`NoiseTrackingControls`, que costuma aparecer na mesma tela, em ingles. O
`GestureWizardCard` e os rotulos de gesto e acao tambem estavam em portugues.

Traduzido:

- `TrackingControls`: "Iniciar/Parar Detecção" -> "Start/Stop Detection",
  "Detectando..." -> "Detecting...", grupos "Exibição"/"Sincronizar" ->
  "Display"/"Sync", e os itens "Olhos", "Boca", "Expressões", "Braços" e
  "Gestos" -> "Eyes", "Mouth", "Expressions", "Arms" e "Gestures"
- `GestureWizardCard`: os textos dos tres passos, as legendas de confirmar e
  cancelar, e "Atalho salvo!"
- `gestureLabel` e `actionLabel`, que alimentam o `GestureIcon`, a
  `GestureLegend` e o wizard

Isso muda texto visivel e o nome acessivel dos controles. Nenhuma API mudou, e
os testes que fixavam as strings acompanharam — incluindo o stub de
`TrackingControls` em `src/mocks`, que renderizava portugues e teria continuado
divergindo do componente real sem ninguem notar.
