# Component Inventory — Storytype Normalization

Generated after `pnpm storytype normalize` — 45 components total

---

## Atoms (12) — Primitivos isolados, sem dependências de outros componentes

| Componente | Localização | Stories | Objetivo Principal |
|------------|-------------|---------|-------------------|
| **Avatar** | `atoms/Avatar.vue` | `Avatar.stories.ts` | Exibe avatar do usuário com imagem ou fallback de iniciais |
| **Badge** | `atoms/Badge.vue` | `Badge.stories.ts` | Label colorido com variantes (primary/success/warning/danger/info) e tamanhos |
| **ProgressBar** | `atoms/ProgressBar.vue` | `ProgressBar.stories.ts` | Indicador visual de progresso com porcentagem e variantes de cor |
| **GestureIcon** | `atoms/gesture-icon/GestureIcon.vue` | `GestureIcon.stories.ts` | Mapeia nomes de gestos para emoji + label opcional (ex: "thumbs-up" → 👍) |
| **TaskinBody** | `atoms/taskin-body/TaskinBody.vue` | `TaskinBody.stories.ts` | SVG elipse do corpo do mascote com animações (float, bounce, sway) |
| **TaskinMouth** | `atoms/taskin-mouth/TaskinMouth.vue` | `TaskinMouth.stories.ts` | SVG path para expressões da boca (neutral, smile, frown, open, wide, o-shape, smirk, surprised) |
| **TaskinEyes** | `atoms/taskin-eyes/TaskinEyes.vue` | `TaskinEyes.stories.ts` | Olhos SVG com rastreamento de pupila (mouse, elemento, custom), blink/squint/wide, composables `useMouseTracking`, `useElementTracking`, `useEyeTracking` |
| **TaskinArms** | `atoms/taskin-arms/TaskinArms.vue` | `TaskinArms.stories.ts` | Braços SVG com ângulos configuráveis de ombro/cotovelo/pulso por braço |
| **TaskinPhone** | `atoms/taskin-phone/TaskinPhone.vue` | `TaskinPhone.stories.ts` | Ícone de telefone SVG personalizável (cores, dimensões, tela, alto-falante) |
| **TaskinTentacle** | `atoms/taskin-tentacle/taskin-tentacle.ts` | `taskin-tentacle.stories.ts` | Tentáculo animado único (path estático ou fluido com keyframes), wiggle/dance/curl/uncurl |
| **WebcamVideo** | `atoms/webcam-video/WebcamVideo.vue` | `WebcamVideo.stories.ts` | Elemento `<video>` oculto para captura de webcam com visibilidade/espelhamento |
| **TaskinTentaclesFluid** | `atoms/taskin-tentacles-fluid/taskin-tentacles-fluid.ts` | `taskin-tentacles-fluid.stories.ts` | Grupo coordenado de tentáculos fluidos (exportado de molecules mas implementação atômica) |

---

## Molecules (20) — Composição de 2+ átomos, lógica de UI contida

| Componente | Localização | Stories | Objetivo Principal | Composição |
|------------|-------------|---------|-------------------|------------|
| **TaskHeader** | `molecules/TaskHeader.vue` | `TaskHeader.stories.ts` | Cabeçalho de tarefa: avatar + nome/email do responsável | `Avatar` |
| **ProjectBreadcrumb** | `molecules/ProjectBreadcrumb.vue` | `ProjectBreadcrumb.stories.ts` | Caminho do projeto truncado com ellipsis | — |
| **TimeEstimate** | `molecules/TimeEstimate.vue` | `TimeEstimate.stories.ts` | Exibição compacta de horas estimadas/gastas/restantes com cores de status | — |
| **DayBar** | `molecules/DayBar.vue` | `DayBar.stories.ts` | Barra de progresso diária com data, horas, preenchimento colorido | — |
| **GestureLegend** | `molecules/gesture-legend/GestureLegend.vue` | `GestureLegend.stories.ts` | Lista horizontal de mapeamentos gesto→ação como chips | `GestureIcon` |
| **GestureWizard** | `molecules/gesture-wizard/GestureWizard.vue` | `GestureWizard.stories.ts` | Modal overlay para wizard de configuração de atalhos de gesto | `GestureWizardCard` |
| **GestureWizardCard** | `molecules/gesture-wizard/GestureWizardCard.vue` | `GestureWizardCard.stories.ts` | UI multi-step do wizard (idle→ready→recording→selecting→confirming→saved) | — |
| **TrackingControls** | `molecules/tracking-controls/TrackingControls.vue` | `TrackingControls.stories.ts` | Toggles: face detection, webcam, sync (eyes/mouth/expressions/arms/gestures) | — |
| **NoiseTrackingControls** | `molecules/noise-tracking-controls/NoiseTrackingControls.vue` | `NoiseTrackingControls.stories.ts` | Noise watcher: toggle, threshold slider, debounce, som | — |
| **FaceTrackingDebug** | `molecules/face-tracking-debug/FaceTrackingDebug.vue` | `FaceTrackingDebug.stories.ts` | Overlay debug com valores de blendshapes faciais | — |
| **TaskinArmWithPhone** | `molecules/taskin-arm-with-phone/TaskinArmWithPhone.vue` | `TaskinArmWithPhone.stories.ts` | Braços SVG com telefone/item no pulso, posição/rotação configuráveis | `TaskinPhone` (via slot) |
| **TaskinTentacleWithItem** | `molecules/taskin-tentacle-with-item/TaskinTentacleWithItem.vue` | `TaskinTentacleWithItem.stories.ts` | Tentáculo com slot para item na ponta | `TaskinTentacle` |
| **TaskinTentaclesFluid** | `molecules/taskin-tentacles-fluid/taskin-tentacles-fluid.ts` | `taskin-tentacles-fluid.stories.ts` | Grupo coordenado de tentáculos fluidos | `TaskinTentacle` (×count) |
| **TaskinEffectTears** | `molecules/taskin-effect-tears/taskin-effect-tears.ts` | `taskin-effect-tears.stories.ts` | Efeito de lágrimas animadas para mood "choro" | — |
| **TaskinEffectHearts** | `molecules/taskin-effect-hearts/taskin-effect-hearts.ts` | `taskin-effect-hearts.stories.ts` | Corações flutuantes para mood "apaixonado" | — |
| **TaskinEffectZzz** | `molecules/taskin-effect-zzz/taskin-effect-zzz.ts` | `taskin-effect-zzz.stories.ts` | ZZZ subindo para mood "dormindo" | — |
| **TaskinEffectThoughtBubble** | `molecules/taskin-effect-thought-bubble/taskin-effect-thought-bubble.ts` | `taskin-effect-thought-bubble.stories.ts` | Bolha de pensamento com texto customizado | — |
| **TaskinEffectVomit** | `molecules/taskin-effect-vomit/taskin-effect-vomit.ts` | `taskin-effect-vomit.stories.ts` | Efeito de vômito para mood "doente" | — |
| **TaskinEffectFartCloud** | `molecules/taskin-effect-fart-cloud/taskin-effect-fart-cloud.ts` | `taskin-effect-fart-cloud.stories.ts` | Nuvem de peido para mood "gases" | — |
| **TaskinEffectPhone** | `molecules/taskin-effect-phone/taskin-effect-phone.ts` | `taskin-effect-phone.stories.ts` | Efeito de telefone para mood "selfie" | — |

---

## Organisms (7) — Features completas, lógica de negócio, múltiplas molecules

| Componente | Localização | Stories | Objetivo Principal | Composição |
|------------|-------------|---------|-------------------|------------|
| **DashboardHeader** | `organisms/DashboardHeader.vue` | `DashboardHeader.stories.ts` | Header fixo: título, status de conexão (connected/disconnected/connecting/error), retry, error banner | Emits: `retry` |
| **GestureSystem** | `organisms/gesture-system/GestureSystem.vue` | `GestureSystem.stories.ts` | Orquestra reconhecimento de gestos + wizard + legend via composables `useGestureRecognizer`, `useGestureShortcuts` | `GestureLegend`, `GestureWizard` |
| **TaskCard** | `organisms/TaskCard.vue` | `TaskCard.stories.ts` | Card completo de tarefa: header, título, breadcrumb, progresso, estimativas, logs diários, datas, tags, avisos | `Badge`, `ProgressBar`, `TaskHeader`, `ProjectBreadcrumb`, `TimeEstimate`, `DayBar` |
| **TaskinWithFaceTracking** | `organisms/taskin/TaskinWithFaceTracking.vue` | `TaskinWithFaceTracking.stories.ts` | Face tracking completo: webcam + controles + TaskinComposed (olhos, boca, mood sync) | `WebcamVideo`, `TrackingControls`, `FaceTrackingDebug`, `TaskinComposed`, `useFaceLandmarker` |
| **TaskinWithFullTracking** | `organisms/taskin/TaskinWithFullTracking.vue` | `TaskinWithFullTracking.stories.ts` | Face + pose tracking: webcam + controles + mascote SVG completo (corpo, braços, olhos, boca) | `WebcamVideo`, `TrackingControls`, `FaceTrackingDebug`, `TaskinBody`, `TaskinArms`, `TaskinEyes`, `TaskinMouth`, `useFaceLandmarker`, `usePoseLandmarker` |
| **TaskinWithShhh** | `organisms/taskin/TaskinWithShhh.vue` | `TaskinWithShhh.stories.ts` | Face tracking + detecção de ruído + reação "shhh" (bolha pensamento, boca O) | `WebcamVideo`, `TrackingControls`, `NoiseTrackingControls`, `FaceTrackingDebug`, `TaskinComposed`, `useFaceLandmarker`, `createNoiseWatcher` |
| **TaskinComposed** | `organisms/taskin/taskin-composed.ts` | `TaskinComposed.stories.ts` | Mascote completo: 20 moods, animações idle, efeitos (tears, hearts, zzz, thought, vomit, fart, phone), braços variantes, 4 tentáculos | `TaskinBody`, `TaskinArms`/`TaskinArmWithPhone`, `TaskinEyes`, `TaskinMouth`, `TaskinTentacleWithItem` (×4), todos `TaskinEffect*` |

---

## Templates / Screens (5) — Layouts de página, estrutura sem lógica de negócio específica

| Componente | Localização | Stories | Objetivo Principal | Composição |
|------------|-------------|---------|-------------------|------------|
| **DashboardLayout** | `templates/DashboardLayout.vue` | `DashboardLayout.stories.ts` | Shell da página: DashboardHeader + slot main content | `DashboardHeader` |
| **Dashboard** | `templates/Dashboard.vue` | `Dashboard.stories.ts` | Dashboard completo: layout + estados loading/empty/task grid | `DashboardLayout`, `TaskGrid` |
| **TaskGrid** | `templates/TaskGrid.vue` | `TaskGrid.stories.ts` | Grid responsivo de TaskCards com header de stats, loading/empty, variantes coluna/gap | `TaskCard` |
| **PrioritizationScreen** | `templates/PrioritizationScreen.vue` | `PrioritizationScreen.stories.ts` | Tela de priorização: toolbar (filtro, view, sort, collapse, undo/redo, export), drag-drop tree, painel gesto/tracking opcional | `PriorityGroupRenderer`, `TrackingControls`, `GestureSystem` |
| **PriorityGroupRenderer** | `templates/PriorityGroupRenderer.vue` | — | Renderizador recursivo da árvore de prioridade (grupos + cards) com drag-drop, difficulty inline, copy, move | Auto-recursivo, `provide/inject dragContext` |

---

## Pages (1) — Páginas roteáveis, conectam composables a templates

| Componente | Localização | Stories | Objetivo Principal | Composição |
|------------|-------------|---------|-------------------|------------|
| **PrioritizationPage** | `pages/PrioritizationPage.vue` | `PrioritizationPage.stories.ts` | Container de página: conecta `usePrioritization` a `PrioritizationScreen`, atalhos teclado, clipboard, ações de gesto | `PrioritizationScreen`, `usePrioritization` |

---

## Resumo por Camada

| Camada | Qtd | Responsabilidade |
|--------|-----|------------------|
| **Atoms** | 12 | Primitivos visuais/funcionais isolados |
| **Molecules** | 20 | Composições de UI com lógica contida |
| **Organisms** | 7 | Features completas com lógica de negócio |
| **Templates/Screens** | 5 | Layouts estruturais sem lógica de domínio |
| **Pages** | 1 | Páginas roteáveis, wiring de composables |

**Total: 45 componentes** — Todos com `.stories.ts` para Storybook