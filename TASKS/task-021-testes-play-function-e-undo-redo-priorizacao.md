# 🧪 Task 021 — Testes de interação (Storybook play function) e undo/redo no board de priorização

Status: done
Type: feat
Assignee: A definir

## Description

O board de priorização (`PrioritizationPage`/`PrioritizationScreen`/`use-prioritization`,
`packages/design-vue`) suporta hoje reordenar (drag) e agrupar/desagrupar tasks via
drag-and-drop nativo, com cobertura de testes unitários apenas para a lógica pura do
composable (`use-prioritization.test.ts`). Falta cobertura de **interação real via DOM**
(drag/drop de verdade) e falta suporte a **undo/redo**.

Esta task cobre dois entregáveis:

1. Testes de interação usando **play function do Storybook** (`@storybook/addon-vitest`,
   executados via Chromium real através do projeto `storybook` em `vitest.workspace.ts`),
   simulando eventos nativos de drag-and-drop (`dragstart`/`dragover`/`drop` via
   `storybook/test`'s `fireEvent`) contra `PrioritizationPage` (precisa ser um componente
   com estado real — via `usePrioritization` — não a `Screen` isolada, que é controlada só
   por props/emits e não reage sozinha ao drop).

2. Undo/redo para as mutações de priorização (reordenar, agrupar, desagrupar, renomear
   grupo, dificuldade).

## Acceptance Criteria

Cenários a cobrir com play function (todos via drag real no DOM):

- [x] Mover uma task para cima de outra (zona "before") aumenta sua prioridade manual
      (posição na lista/`order`).
- [x] Mover uma task para dentro de outra (zona "group", meio do card) cria um grupo
      novo com as duas tasks.
- [x] Mover mais uma task para dentro desse grupo já existente resulta em um grupo com
      3 tasks.
- [x] Retirar uma task de um grupo (drag para a zona before/after de uma task fora do
      grupo) remove-a do grupo, preservando o grupo restante.
- [x] Retirar a penúltima/última task de um grupo que tinha só 2 tasks **dissolve o
      grupo** (a task remanescente volta a ser um card avulso) — já implementado em
      `use-prioritization.ts` (`removeTaskById`), falta o teste de interação ponta-a-ponta.

Undo/redo:

- [x] `undo()`/`redo()` com pilha de histórico no **composable** (`use-prioritization.ts`),
      cobrindo as mutações de domínio (mover, agrupar, desagrupar, renomear grupo, dificuldade)
      — preferências de view (filtro/view mode/sort/collapse) não entram no histórico.
- [x] `PrioritizationScreen` ganha botões de "Desfazer"/"Refazer" na toolbar, controlados
      via props (`can-undo`/`can-redo`) e emits (`undo`/`redo`) — sem lógica de histórico
      dentro da Screen (mantém o padrão: Screen é puramente apresentacional).
- [x] `PrioritizationPage` liga atalhos de teclado (Ctrl/Cmd+Z e Ctrl/Cmd+Shift+Z) que
      chamam as mesmas ações do composable usadas pelos botões da Screen.
- [x] Testes unitários do composable para undo/redo (histórico, canUndo/canRedo, limite
      de histórico, redo invalidado por nova ação).

## Resultado

Implementado conforme planejado, com um achado extra: escrever o play function do
cenário "mover mais uma task para dentro do grupo já existente" expôs um bug real
pré-existente — o drop direto no container do grupo (`intent.type === 'ingroup'`)
chamava `groupWith(draggedId, groupId)`, mas `groupWith` localiza o alvo por **id de
task**, não por **id de grupo**, então a task nunca entrava no grupo (virava avulsa).
Corrigido com uma ação dedicada `joinGroup(taskId, groupId)` no composable, usada pela
Screen/Page via um novo evento `join-group` (`use-prioritization.ts`,
`PrioritizationScreen.vue`, `PrioritizationPage.vue`), com testes unitários cobrindo o
caso e o no-op quando a task já é membro do grupo.

Também foi criado `packages/design-vue/vitest.storybook.config.ts` (config local, não
o `vitest.workspace.ts` da raiz) para rodar os testes de interação via
`@storybook/addon-vitest` + Chromium/Playwright — o workspace da raiz não resolve
`@storybook/addon-vitest`/`@vitest/browser-playwright` por não serem dependências do
root (só de `packages/design-vue`), então roda-se com
`cd packages/design-vue && npx vitest run --config vitest.storybook.config.ts`.

## Decisão de arquitetura (registrada para contexto futuro)

Foi cogitado colocar toda a lógica de undo/redo dentro da `Screen`. Optou-se por manter
a `Screen` puramente apresentacional (consistente com o resto do board): o **estado**
do histórico vive no composable, ao lado de `changedTasks`/`acknowledgeChanges`; a
**Screen só renderiza os botões** (props/emits, como qualquer outra ação); a **Page**
adiciona os atalhos de teclado chamando as mesmas ações do composable. Isso evita
duplicar/dessincronizar estado entre Screen e composable.
