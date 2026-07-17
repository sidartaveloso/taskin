# Task 022 — Gesture Recognition with MediaPipe GestureRecognizer

Status: pending  
Type: feat  
Assignee: developer

## Description

Implementar sistema de reconhecimento de gestos manuais usando MediaPipe GestureRecognizer (https://mediapipe-studio.webapps.google.com/studio/demo/gesture_recognizer). O sistema deve detectar gestos das mãos do usuário via webcam e mapeá-los para ações de priorização — subir/descer task, agrupar/desagrupar, etc.

## Objectives

### Phase 1: Core Composable (Priority 1)

- [ ] Criar composable `useGestureRecognizer` similar ao `usePoseLandmarker`/`useFaceLandmarker`
- [ ] Implementar detecção de landmarks de mãos (21 pontos por mão)
- [ ] Reconhecer gestos pré-definidos: `None`, `Closed_Fist`, `Open_Palm`, `Pointing_Up`, `Thumb_Down`, `Thumb_Up`, `Victory`, `ILoveYou`
- [ ] Tipos TypeScript para estado do gesture recognizer
- [ ] State tracking com histerese (evitar bouncing entre gestos)

### Phase 2: Gesture-to-Action Mapping (Priority 1)

- [ ] Mapear `Pointing_Up` → `moveUp` no item focado
- [ ] Mapear `Thumb_Down` → `moveDown` no item focado
- [ ] Mapear `Victory` → `groupWith` (agrupar item focado com o seguinte)
- [ ] Mapear `Open_Palm` → `ungroup` no grupo focado
- [ ] Mapear `ILoveYou` → `joinGroup` (juntar ao grupo do irmão)
- [ ] Mapear `Closed_Fist` → `undo`
- [ ] Mapear `Thumb_Up` → confirmar/commit
- [ ] Debounce de gestos (não repetir ação a cada frame)

### Phase 3: UI Integration (Priority 2)

- [ ] Criar `taskin-hands.vue` (atomo SVG das mãos do Taskin reagindo a gestos)
- [ ] Criar `gesture-controls.vue` (molecular: start/stop + feedback visual)
- [ ] Adicionar `focusId` ref no `PrioritizationScreen` para rastrear item focado
- [ ] Integrar gesture recognizer no `PrioritizationPage` via teclado virtual ou via webcam
- [ ] Exibir gesto reconhecido como feedback visual (tooltip/overlay)
- [ ] Storybooks para gesture tracking

### Phase 4: Polish & Tests (Priority 3)

- [ ] Testes unitários do composable (gesto → ação)
- [ ] Testes de play function no storybook
- [ ] Tratamento de erro (câmera não disponível, permissão negada)
- [ ] Typecheck limpo

## Technical Details

### MediaPipe Gesture Recognizer

**Canned gestures (built-in):**
| Gesture | Significado | Ação na priorização |
|---------|-------------|---------------------|
| `None` | Mão não detectada/gesto neutro | Nenhuma |
| `Closed_Fist` | Punho fechado | Undo |
| `Open_Palm` | Mão aberta | Ungroup (desagrupar) |
| `Pointing_Up` | Dedo indicador levantado | Move Up |
| `Thumb_Down` | Polegar para baixo | Move Down |
| `Thumb_Up` | Polegar para cima | Confirmar/commit |
| `Victory` | V (paz/vitória) | Group With (agrupar) |
| `ILoveYou` | 🤟 (rock on) | Join Group |

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

### Histerese para evitar bouncing

```typescript
const GESTURE_HYSTERESIS_MS = 500; // ms antes de aceitar o mesmo gesto novamente
const GESTURE_CONFIDENCE_THRESHOLD = 0.6;

// Só dispara ação se:
// 1. Score >= threshold
// 2. Passou tempo mínimo desde último disparo do mesmo gesto
// 3. Gesto mudou desde a última ação
```

### Focus Tracking

O item "focado" é o último item (task ou grupo) que recebeu clique ou hover:
```typescript
const focusedId = ref<string | null>(null);
function onFocusNode(id: string) { focusedId.value = id; }
```

## File Structure

```
packages/design-vue/src/
├── composables/
│   ├── use-gesture-recognizer.ts (new)
│   ├── use-prioritization.ts (existing — ações já exportadas)
│   └── index.ts (export new composable)
├── components/
│   ├── atoms/
│   │   ├── taskin-hands/
│   │   │   ├── taskin-hands.vue (new — mãos do Taskin para feedback gestual)
│   │   │   ├── taskin-hands.types.ts (new)
│   │   │   └── taskin-hands.stories.ts (new)
│   │   └── webcam-video/ (reuse)
│   ├── molecules/
│   │   └── gesture-controls/
│   │       ├── gesture-controls.vue (new — botão start/stop + feedback)
│   │       ├── gesture-controls.types.ts (new)
│   │       └── gesture-controls.stories.ts (new)
│   └── pages/
│       └── PrioritizationPage.vue (add gesture integration)
```

## Implementation Steps

### Step 1: Create Gesture Recognizer Composable

- Seguir padrão de `use-face-landmarker.ts` / `use-pose-landmarker.ts`
- Usar `GestureRecognizer` do `@mediapipe/tasks-vision`
- Detectar mãos e gestos em loop via `requestAnimationFrame`
- Expor `state` com last recognized gesture, confidence, landmarks
- Implementar `startDetection`/`stopDetection` + cleanup no `onUnmounted`
- Implementar histerese para evitar bouncing

### Step 2: Create Gesture-to-Action Mapping

- Composable expõe `lastAction: ComputedRef<GestureAction | null>`
- Page faz `watch` no `lastAction` e chama função correspondente
- Mapear gesto → emit/callback com debounce

### Step 3: Integrate with PrioritizationPage

- Adicionar `focusedId` tracking
- Passar `onGestureAction` callback para o screen
- Screen mostra feedback visual (nome do gesto + ação)

## Dependencies

- `@mediapipe/tasks-vision` (já instalado — GestureRecognizer incluso)
- Existing `usePrioritization` composable

## References

- MediaPipe GestureRecognizer: https://mediapipe-studio.webapps.google.com/studio/demo/gesture_recognizer
- MediaPipe Docs: https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
- Existing composables: `use-face-landmarker.ts`, `use-pose-landmarker.ts`
- Prioritization Page: `PrioritizationPage.vue`
