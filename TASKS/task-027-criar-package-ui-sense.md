# Task 027 — criar package ui-sense

- Status: done
- Type: refactor
- Assignee: sidarta-veloso

## Description

pacote de sensores e reações que possibilitam melhor interação com os usuários

## Tasks

- [x] Package `@opentask/ui-sense` criado em `packages/ui-sense/`
- [x] Composables de sensores: `use-gesture-recognizer`, `use-gesture-shortcuts`, `use-face-landmarker`, `use-pose-landmarker`, `use-eye-tracking`, `use-mouse-tracking`, `use-element-tracking`
- [x] Componentes de gesto: `GestureIcon`, `WebcamVideo`, `GestureLegend`, `GestureWizard`, `TrackingControls`, `GestureSystem`
- [x] Consumido por design-vue (`PrioritizationPage`/`PrioritizationScreen`)

## Notes

Estrutura atual e integração documentadas na task-022. Wizard e mapeamento configurável: tasks 024 e 025.
