# Proposta de Reorganização — Atomic Design + Storybook

Baseada na análise de 45 componentes e seus relacionamentos reais.

---

## Problemas Identificados

1. **TaskinComposed vs Taskin.ts**: duas implementações paralelas do mascote (uma por injecão de SVG imperativa, outra por composição de átomos). Apenas `taskin-composed.ts` deveria existir.
2. **TaskinWithFullTracking bypassa TaskinComposed**: monta os átomos diretamente, duplicando lógica e sem suporte a moods
3. **TaskinWithShhh passa props que não existem em TaskinComposed**: `show-thought-bubble` e `thought-bubble-text` são ignoradas
4. **7 TaskinEffect* idênticos**: differem só no SVG/coordenadas — candidatos a um único componente genérico `TaskinEffect` com variante por parâmetro
5. **TaskinTentaclesFluid** duplicado: exportado de `atoms/` e `molecules/`
6. **Storybook inconsistente**: `TaskinWithShhh` solto, `TaskinMascot` solto, títulos duplicados (Full Tracking V2)
7. **Molecules que não compõem** (`TimeEstimate`, `ProjectBreadcrumb`, `DayBar`, `FaceTrackingDebug`, `NoiseTrackingControls`, `TrackingControls`) — nenhum depende de outro componente, deveriam ser atoms
8. **Moods `annoyed` e `neutral`** idênticos na config

---

## Proposta de Reorganização

### 1. Átomos → mover molecules que não compõem

| Componente | Atual | Proposto | Motivo |
|------------|-------|----------|--------|
| `TimeEstimate` | molecule | **atom** | Não compõe nenhum outro componente |
| `ProjectBreadcrumb` | molecule | **atom** | Primitivo visual com props escalares |
| `DayBar` | molecule | **atom** | Primitivo de progresso diário |
| `FaceTrackingDebug` | molecule | **atom** | Overlay debug, sem dependências |
| `TrackingControls` | molecule | **atom** | Conjunto de toggles, sem dependências |
| `NoiseTrackingControls` | molecule | **atom** | Slider + toggle, sem dependências |
| `GestureWizardCard` | molecule | **atom** | UI puramente visual de wizard step (movido junto) |

### 2. Remover duplicação Taskin

- **Eliminar `Taskin.ts`** (e mascote inteiro): todo o comportamento está duplicado em `taskin-composed.ts` que é superior (decomposto, testável, componível)
- **Refatorar `TaskinWithFullTracking`** para usar `TaskinComposed` internamente, como seus irmãos FaceTracking e Shhh
- **Mover `TaskinWithShhh`** para `Organisms/Taskin/Shhh Tracking` no Storybook

### 3. Unificar TaskinEffect* em componente único

**Problema**: 7 componentes com props idênticas (`animationsEnabled`, opcionalmente `text`), mesma interface de controller (`show()`, `hide()`), diferem só no SVG interno e coordenadas.

**Proposta**: Um único componente `TaskinEffect` com prop `variant`:

```typescript
type EffectVariant = 'tears' | 'hearts' | 'zzz' | 'thought-bubble' | 'vomit' | 'fart-cloud' | 'phone'
```

Benefícios:
- Elimina 6 diretórios + 6 arquivos de tipo + 6 stories (de ~28 arquivos para ~4)
- Garante consistência de interface
- Fácil adicionar novos effects sem criar componente

### 4. Consolidar TaskinTentaclesFluid

- Manter apenas em `molecules/` (onde faz sentido: compõe múltiplos `TaskinTentacle`)
- Remover de `atoms/`

### 5. Reorganização Storybook

**Antes** (inconsistente):
```
Organisms/
  TaskinMascot                          (taskin.ts)
  Taskin/
    Composed                            (taskin-composed.ts)
    Face Tracking                       (TaskinWithFaceTracking)
    Full Tracking                       (TaskinWithFullTracking)
  TaskinWithShhh                        (SOLTO - erro)
```

**Depois** (consistente):
```
Organisms/
  Taskin/
    Composed                            (taskin-composed.ts)
    Face Tracking                       (TaskinWithFaceTracking)
    Full Tracking                       (TaskinWithFullTracking)
    Shhh Tracking                       (TaskinWithShhh)
```

### 6. Hierarquia final no Storybook

```
Atoms/
  Avatar
  Badge
  ProgressBar
  DayBar
  ProjectBreadcrumb
  TimeEstimate
  FaceTrackingDebug
  TrackingControls
  NoiseTrackingControls
  GestureIcon
  WebcamVideo
  Taskin/
    Arms
    Body
    Eyes
    Mouth
    Phone
    Tentacle

Molecules/
  TaskHeader                              (Avatar)
  GestureLegend                           (GestureIcon)
  GestureWizard                           (GestureWizardCard + overlay/teleport)
  Taskin/
    ArmWithPhone                          (TaskinPhone)
    TentacleWithItem                      (TaskinTentacle)
    TentaclesFluid                        (TaskinTentacle ×N)
    Effect                                (variants: tears, hearts, zzz, ...)

Organisms/
  DashboardHeader
  TaskCard                                (Badge, ProgressBar, TaskHeader, ProjectBreadcrumb, TimeEstimate, DayBar)
  GestureSystem                           (GestureLegend, GestureWizard)
  Taskin/
    Composed                              (todos atoms/molecules Taskin + Effect)
    Face Tracking                         (TaskinComposed + WebcamVideo + TrackingControls)
    Full Tracking                         (TaskinComposed + WebcamVideo + TrackingControls)
    Shhh Tracking                         (TaskinComposed + WebcamVideo + TrackingControls + NoiseTrackingControls)

Templates/
  DashboardLayout                         (DashboardHeader)
  Dashboard                               (DashboardLayout + TaskGrid)
  TaskGrid                                (TaskCard)
  PrioritizationScreen                    (PriorityGroupRenderer + TrackingControls + GestureSystem)

Pages/
  PrioritizationPage                      (PrioritizationScreen)
```

---

## Resumo das Ações

| Ação | Impacto |
|------|---------|
| **Mover 7 molecules → atoms** | `TimeEstimate`, `ProjectBreadcrumb`, `DayBar`, `FaceTrackingDebug`, `TrackingControls`, `NoiseTrackingControls`, `GestureWizardCard` |
| **Unificar 7 TaskinEffect → 1** | Reduz ~28 arquivos para ~4. Elimina diretórios duplicados. |
| **Deletar Taskin.ts** | Sem perda de funcionalidade (coberto por taskin-composed.ts) |
| **Refatorar TaskinWithFullTracking** | Usar `TaskinComposed` internamente |
| **Corrigir props TaskinWithShhh** | Adicionar `showThoughtBubble` + `thoughtBubbleText` a `TaskinComposed` |
| **Consolidar TaskinTentaclesFluid** | Manter só em molecules/, remover de atoms/ |
| **Reorganizar Storybook titles** | Agrupar Taskin* sob `Organisms/Taskin/`, corrigir títulos inconsistentes |
| **Remover mood duplicado** | Unificar `annoyed`/`neutral` ou diferenciar visualmente |

### Estimativa de esforço

- **Alta**: refatorar `TaskinWithFullTracking` (requer testar que pose tracking ainda funciona)
- **Média**: unificar `TaskinEffect*` (refatoração mecânica, bem isolada)
- **Baixa**: mover molecules → atoms (só diretório + stories title + index.ts exports)
- **Baixa**: reorganizar Storybook titles (só string literal em cada stories.ts)
- **Baixa**: deletar `Taskin.ts` (verificar imports primeiro)