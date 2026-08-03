# Task 022 — Gesture Recognition com MediaPipe GestureRecognizer (núcleo)

Status: pending  
Type: feat  
Assignee: developer

## Description

Núcleo de reconhecimento de gestos manuais usando MediaPipe `GestureRecognizer`. Detecta gestos das mãos do usuário via webcam e expõe o estado de reconhecimento (gesto + confiança + landmarks) para consumo por outras camadas.

O mapeamento gesto→ação e o wizard de configuração não fazem parte desta task — são cobertos pelas tasks 024 e 025 (e pela spec histórica 023). O package `@opentask/ui-sense` (`packages/ui-sense/`) já contém o composable base e os componentes; esta task cobre a revisão e os testes do núcleo de reconhecimento.

> **Scope desta task:** `useGestureRecognizer` + componentes de apoio de reconhecimento. Wizard, mapeamento configurável e integração na priorização → ver task-024 e task-025.

## Objectives

### Phase 1: Composable `useGestureRecognizer` (done — review only)

Já existe em `packages/ui-sense/src/composables/use-gesture-recognizer.ts`:

- [x] Detecção de landmarks de mãos (21 pontos por mão) via MediaPipe `GestureRecognizer`
- [x] Canned gestures: `None`, `Closed_Fist`, `Open_Palm`, `Pointing_Up`, `Thumb_Down`, `Thumb_Up`, `Victory`, `ILoveYou`
- [x] Tipos TypeScript: `CannedGesture`, `RecognizedGesture`, `HandLandmark`, `GestureRecognizerState`, `Handedness`, `UseGestureRecognizerOptions`
- [x] Histerese via `isGestureHeld(gesture, minHoldMs)`
- [x] `getStableGesture()` com threshold de confiança (default 0.6)
- [x] `startDetection`/`stopDetection` + cleanup no `onUnmounted`
- [x] Tratamento de erro de câmera/permissão (`state.error`)

**Revisar/melhorar se necessário:**
- [ ] Verificar `GestureRecognizer.createFromOptions` com `runningMode: 'IMAGE'` em loop via `requestAnimationFrame`
- [ ] Revisar pooling/histerese de gestos (bouncing entre frames)

### Phase 2: Testes do núcleo (Priority 2)

- [ ] Testes unitários para `use-gesture-recognizer.ts` (estado, threshold, histerese, erro)
- [ ] Testes dos componentes de apoio: `GestureIcon.spec.ts` (existe), `WebcamVideo.spec.ts` (existe)
- [ ] Tratamento de erro UX (câmera não disponível, permissão negada) — verificar exposição no componente
- [ ] Typecheck limpo em `ui-sense`

## Technical Details

### MediaPipe Gesture Recognizer

**Canned gestures (built-in):**
| Gesture | Significado |
|---------|-------------|
| `None` | Mão não detectada/gesto neutro |
| `Closed_Fist` | Punho fechado |
| `Open_Palm` | Mão aberta |
| `Pointing_Up` | Dedo indicador levantado |
| `Thumb_Down` | Polegar para baixo |
| `Thumb_Up` | Polegar para cima |
| `Victory` | V (paz/vitória) |
| `ILoveYou` | 🤟 (rock on) |

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

Implementada no `use-gesture-recognizer.ts`:
- `isGestureHeld(gesture, minHoldMs)` — só retorna `true` se o gesto for mantido por `minHoldMs`
- `getStableGesture()` — retorna o gesto com maior score que ultrapasse `gestureScoreThreshold` (default 0.6)

## File Structure (current)

```
packages/ui-sense/src/
├── composables/
│   ├── use-gesture-recognizer.ts     (núcleo — MediaPipe GestureRecognizer)
│   └── index.ts                      (re-exporta o composable)
└── components/
    ├── atoms/
    │   ├── gesture-icon/             (GestureIcon.vue + types/spec/stories)
    │   └── webcam-video/             (WebcamVideo.vue + types/spec/stories)
    └── organisms/
        └── gesture-system/           (GestureSystem.vue — consome o núcleo)
```

## Implementation Steps

### Step 1: Review Composables

- Revisar `use-gesture-recognizer.ts` — verificar loop `requestAnimationFrame`, cleanup, histerese
- Adicionar testes unitários faltantes

### Step 2: Polish Error UX

- Garantir tratamento de erro amigável no componente (câmera negada, ausente, etc.)

## Dependencies

- `@mediapipe/tasks-vision` (já instalado em `ui-sense`)

## References

- MediaPipe GestureRecognizer: https://mediapipe-studio.webapps.google.com/studio/demo/gesture_recognizer
- MediaPipe Docs: https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
- Composable: `use-gesture-recognizer.ts`
- Componentes: `GestureIcon`, `WebcamVideo`, `GestureSystem`
- Wizard/mapeamento/integração: task-023 (spec), task-024 (wizard), task-025 (integração)
