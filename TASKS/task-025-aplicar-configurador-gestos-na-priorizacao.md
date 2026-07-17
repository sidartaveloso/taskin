# Task 025 — Aplicar configurador de gestos na tela de priorização

Status: pending  
Type: feat  
Assignee: fernandogatti  
Depends on: task-024

## Description

Após o `GestureWizard` estar reutilizável (task-024), integrá-lo na `PrioritizationPage` substituindo o mapeamento fixo atual por funções configuráveis via wizard. O usuário pode reconfigurar a qualquer momento qual gesto executa qual ação de priorização.

## Funções expostas no wizard da tela de tasks

| id | title | Descrição | Atalho teclado | Gesto padrão |
|----|-------|-----------|----------------|--------------|
| `moveUp` | Mover para cima | Aumenta a prioridade da tarefa focada | `⌘↑` | `Pointing_Up` |
| `moveDown` | Mover para baixo | Diminui a prioridade da tarefa focada | `⌘↓` | `Thumb_Down` |
| `groupWith` | Agrupar | Agrupa a tarefa focada com a adjacente | `⌘G` | `Victory` |
| `ungroup` | Desagrupar | Dissolve o grupo focado | `⌘⇧G` | `Open_Palm` |
| `setDifficulty1` | Dificuldade 1 | Marca dificuldade como muito fácil | `⌘1` | — |
| `setDifficulty2` | Dificuldade 2 | Marca dificuldade como fácil | `⌘2` | — |
| `setDifficulty3` | Dificuldade 3 | Marca dificuldade como média | `⌘3` | — |
| `setDifficulty4` | Dificuldade 4 | Marca dificuldade como difícil | `⌘4` | — |
| `setDifficulty5` | Dificuldade 5 | Marca dificuldade como muito difícil | `⌘5` | — |
| `undo` | Desfazer | Desfaz a última ação | `⌘Z` | `Closed_Fist` |
| `copyCard` | Copiar card | Copia o texto do card focado | `⌘C` | — |

## Requisitos funcionais

- A `PrioritizationPage` deve passar seu array de funções configuráveis para o `GestureWizard`
- O usuário ativa o wizard com mão aberta por 2s (igual ao behavior atual)
- Cada gesto configurado substitui o default apenas para aquela função
- Funções sem gesto configurado (puladas) mantêm o comportamento atual (teclado/drag)
- As ações devem ser executadas com base no mapping vigente (vindo do wizard)
- `focusedId` continua sendo o mecanismo para definir o alvo da ação

## Testes com play function

Criar testes que:

1. **Abrir wizard e configurar gesto para `moveUp`** — mockar mão aberta 2s → wizard abre → função "Mover para cima" → mockar `Pointing_Up` 2s → confirmar → verificar mapping salvo
2. **Pular todas as funções** — verificar que defaults permanecem
3. **Verificar que gesto configurado executa ação** — configurar `moveUp` como `Thumb_Up` → focar um card → mockar `Thumb_Up` → verificar card subiu
4. **Regressão: drag-and-drop continua funcionando** — executar play function de drag existente e verificar que não quebrou
5. **Dificuldade por gesto** — configurar `setDifficulty3` com `ILoveYou` → focar card → mockar `ILoveYou` → verificar difficulty = 3

Aproveitar a estrutura de testes existente em `PrioritizationPage.stories.ts` (mock de tasks, `getCard`, `dragOnto`, etc.) e estender com mock de `getStableGesture`/`isGestureHeld`.

## Tarefas

- [ ] Importar `GestureWizard` com a nova API (task-024) no `PrioritizationPage`
- [ ] Definir array `prioritizationFunctions` com as 11 funções da tabela acima
- [ ] Substituir `useGestureShortcuts` pelo novo fluxo baseado em array
- [ ] Conectar `onComplete` para salvar mappings no `localStorage`
- [ ] Adicionar `KeyboardShortcut` opcional ao `ConfigurableFunction` (se task-024 já suportar)
- [ ] Criar `src/components/pages/PrioritizationPage.play.test.ts` com play functions
- [ ] Reaproveitar `getCard`, `dragOnto`, `dragIntoGroup` dos testes existentes
- [ ] Verificar que todos os testes de drag-and-drop existentes ainda passam
- [ ] Typecheck + lint limpos

## Arquivos relevantes

- `src/components/pages/PrioritizationPage.vue`
- `src/components/pages/PrioritizationPage.stories.ts`
- `src/components/molecules/gesture-wizard/gesture-wizard.vue`
- `src/composables/use-gesture-shortcuts.ts`
