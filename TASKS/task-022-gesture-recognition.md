# Task 022 — Gesture Recognition with MediaPipe GestureRecognizer

Status: pending  
Type: feat  
Assignee: developer

## Description

Implementar sistema de reconhecimento de gestos manuais usando MediaPipe GestureRecognizer. O sistema deve detectar gestos das mãos do usuário via webcam e mapeá-los para ações de priorização — subir/descer task, agrupar/desagrupar, etc.

O pacote `@opentask/ui-sense` (`packages/ui-sense/`) já contém a infraestrutura base (composables, componentes atômicos e moleculares). Esta task cobre o que ainda está pendente para completar o pipeline.

## Objectives

### Phase 1: Composables (done — review only)

Os seguintes composables já existem em `packages/ui-sense/src/composables/`:

- [x] `useGestureRecognizer` — reconhecimento de gestos via MediaPipe `GestureRecognizer`
- [x] `useGestureShortcuts` — mapeamento gesto→ação configurável por usuário com wizard de calibração

**Revisar/melhorar se necessário:**
- [ ] Tipos: `CannedGesture`, `RecognizedGesture`, `HandLandmark`, `GestureRecognizerState`, `PrioritizationAction`, `WizardState`, `GestureMapping`
- [ ] Histerese via `isGestureHeld(gesture, minHoldMs)` no `useGestureRecognizer`
- [ ] `getStableGesture` com threshold de confiança (0.6)
- [ ] Persistência de mapeamentos por `userId` no `localStorage`

### Phase 2: Gesture-to-Action Mapping (done — review only)

O `useGestureShortcuts` já implementa o mapeamento completo com wizard:

| Gesto | Ação padrão | Status |
|-------|-------------|--------|
| `Pointing_Up` | `moveUp` | ✅ |
| `Thumb_Down` | `moveDown` | ✅ |
| `Victory` | `groupWith` | ✅ |
| `Open_Palm` | `ungroup` | ✅ |
| `Closed_Fist` | `undo` | ✅ |

Gestos adicionais disponíveis para mapeamento customizável pelo wizard:
- `Thumb_Up`, `ILoveYou`, `None`

Ações disponíveis no wizard:
- `moveUp`, `moveDown`, `groupWith`, `ungroup`, `undo`, `copyCard`
- `setDifficulty1`–`setDifficulty5`, `none`

- [ ] Revisar polling interval (300ms no `GestureSystem`) com debounce adequado

### Phase 3: UI Components (partially done)

Componentes já existentes em `packages/ui-sense/src/components/`:

| Componente | Tipo | Caminho | Status |
|------------|------|---------|--------|
| `WebcamVideo` | Atom | `atoms/webcam-video/` | ✅ |
| `GestureIcon` | Atom | `atoms/gesture-icon/` | ✅ |
| `GestureLegend` | Molecule | `molecules/gesture-legend/` | ✅ |
| `GestureWizard` + `GestureWizardCard` | Molecule | `molecules/gesture-wizard/` | ✅ |
| `TrackingControls` | Molecule | `molecules/tracking-controls/` | ✅ |
| `GestureSystem` | Organism | `organisms/gesture-system/` | ✅ |

**Integração com design-vue:**

- [x] `PrioritizationPage.vue` em `packages/design-vue/src/components/pages/` — já possui `focusedId`, chama `onGestureAction`, passa `gesture-functions` e `gesture-user-id`
- [x] `PrioritizationScreen.vue` em `packages/design-vue/src/components/templates/` — já renderiza `TrackingControls` + `GestureSystem` com webcam oculta

**Pendente:**
- [ ] Testar/validar o fluxo completo: webcam → `useGestureRecognizer` → `useGestureShortcuts` → `GestureSystem` → `PrioritizationPage.onGestureAction`
- [ ] Feedback visual do gesto reconhecido na tela de priorização (tooltip/overlay com `GestureIcon`)
- [ ] Storybook para `GestureSystem` já existe — verificar play function tests

### Phase 4: Polish & Tests (Priority 3)

- [ ] Testes unitários para `use-gesture-recognizer.ts`
- [ ] Testes unitários para `use-gesture-shortcuts.ts` (mapeamento gesto→ação + wizard)
- [ ] Testes de play function no storybook do `GestureSystem`
- [ ] Testes dos componentes: `GestureIcon.spec.ts` (existe), `GestureWizardCard.spec.ts` (existe)
- [ ] Tratamento de erro (câmera não disponível, permissão negada) — já existe no `useGestureRecognizer`, verificar UX
- [ ] Typecheck limpo em ambos os pacotes

## Technical Details

### MediaPipe Gesture Recognizer

**Canned gestures (built-in):**
| Gesture | Significado | Ação padrão |
|---------|-------------|-------------|
| `None` | Mão não detectada/gesto neutro | Nenhuma |
| `Closed_Fist` | Punho fechado | Undo |
| `Open_Palm` | Mão aberta | Ungroup ou iniciar wizard |
| `Pointing_Up` | Dedo indicador levantado | Move Up |
| `Thumb_Down` | Polegar para baixo | Move Down |
| `Thumb_Up` | Polegar para cima | Navegar opções no wizard |
| `Victory` | V (paz/vitória) | Group With |
| `ILoveYou` | 🤟 (rock on) | Configurável via wizard |

**Hand Landmarks (21 points):**
```
 0: Wrist
 1: Thumb CMC
 2: Thumb MCP
 3: Thumb IP
 4: Thumb Tip
 5: Index MCP
 6: Index PIP
 7: Index DIP
 8: Index Tip
 9: Middle MCP
10: Middle PIP
11: Middle DIP
12: Middle Tip
13: Ring MCP
14: Ring PIP
15: Ring DIP
16: Ring Tip
17: Pinky MCP
18: Pinky PIP
19: Pinky DIP
20: Pinky Tip
```

### Histerese

Implementada via `isGestureHeld()` no `use-gesture-recognizer.ts`:
- `isGestureHeld(gesture, minHoldMs)` — só retorna `true` se o gesto for mantido por `minHoldMs`
- `getStableGesture()` — retorna o gesto com maior score que ultrapasse `gestureScoreThreshold` (default 0.6)

### Wizard de Configuração

O `useGestureShortcuts` implementa um wizard com estados:
1. `IDLE` — mão aberta por 2s → `READY`
2. `READY` — manter mão aberta por 5s ou trocar gesto → `RECORDING`
3. `RECORDING` — fazer um gesto e segurar 2s → `SELECTING`
4. `SELECTING` — `Thumb_Up`/`Thumb_Down` para navegar ações, `Closed_Fist` para confirmar → `CONFIRMING`
5. `CONFIRMING` — `Closed_Fist` para salvar, `Open_Palm`/`Thumb_Down` para cancelar → `SAVED`

Mapeamentos são persistidos por `userId` no `localStorage`.

### Focus Tracking

O item "focado" é o último item (task ou grupo) que recebeu clique ou hover:
```typescript
// Em PrioritizationPage.vue:
const focusedId = ref<string | null>(null);
// Passado para PrioritizationScreen que o injeta no drag context
```

## File Structure (current)

```
packages/
├── ui-sense/src/
│   ├── composables/
│   │   ├── use-gesture-recognizer.ts     (gestão do MediaPipe GestureRecognizer)
│   │   ├── use-gesture-shortcuts.ts      (mapeamento gesto→ação + wizard)
│   │   └── index.ts                      (re-exporta ambos)
│   └── components/
│       ├── atoms/
│       │   ├── gesture-icon/             (GestureIcon.vue + types/spec/stories)
│       │   └── webcam-video/             (WebcamVideo.vue + types/spec/stories)
│       ├── molecules/
│       │   ├── gesture-legend/           (GestureLegend.vue + types/spec/stories)
│       │   ├── gesture-wizard/           (GestureWizard + GestureWizardCard)
│       │   ├── tracking-controls/        (TrackingControls.vue)
│       │   └── ...
│       └── organisms/
│           └── gesture-system/           (GestureSystem.vue — orchestrator)
└── design-vue/src/
    ├── composables/
    │   └── use-prioritization.ts         (existing — ações exportadas)
    └── components/
        ├── pages/
        │   └── PrioritizationPage.vue    (já integra GestureSystem)
        └── templates/
            └── PrioritizationScreen.vue  (já renderiza TrackingControls + GestureSystem)
```

## Dependencies

- `@mediapipe/tasks-vision` (já instalado em `ui-sense`)
- `@opentask/ui-sense` (já é dependência de `design-vue`)

## Implementation Steps

### Step 1: Review & Test Composables

- Revisar `use-gesture-recognizer.ts` — verificar se `GestureRecognizer.createFromOptions` com `runningMode: 'IMAGE'` funciona corretamente em loop via `requestAnimationFrame`
- Revisar `use-gesture-shorts.ts` — testar wizard flow, persistência, edge cases
- Adicionar testes unitários faltantes

### Step 2: Validate Integration

- Testar `GestureSystem` em storybook com webcam real (play function)
- Verificar fluxo completo em `PrioritizationPage`: webcam → gesto → ação de priorização
- Verificar que `focusedId` está sendo populado corretamente para que `onGestureAction` tenha alvo

### Step 3: Polish UI Feedback

- Adicionar feedback visual do gesto reconhecido na `PrioritizationScreen` (ex.: tooltip com `GestureIcon`)
- Garantir tratamento de erro amigável (câmera negada, ausente, etc.)

## References

- MediaPipe GestureRecognizer: https://mediapipe-studio.webapps.google.com/studio/demo/gesture_recognizer
- MediaPipe Docs: https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
- Composables existentes: `use-gesture-recognizer.ts`, `use-gesture-shorts.ts`
- Componentes existentes: `GestureSystem`, `GestureWizard`, `GestureLegend`, `GestureIcon`, `TrackingControls`
- Páginas: `PrioritizationPage.vue`, `PrioritizationScreen.vue`
