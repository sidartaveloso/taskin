# Task 034 — Decisões de design: tipos branded (TaskId/GroupId), Task.parent/TaskCard e migração em curso

Status: pending\
Type: docs\
Assignee: sidarta-veloso\

## Description

Durante a migração em andamento (WIP da branch `feat/task-032`) para tipos branded
`TaskId`/`GroupId` e o novo campo `Task.parent: ParentRef` (que substitui `groupId`/`groupName`),
foram adiados pontos que dependem de **decisão de design de produto/modelagem** e não de
correção mecânica de tipos. A migração mecânica segue em paralelo; esta task registra as
decisões em aberto para não bloquear a implementação.

## Tasks

### 1. Como o TaskCard deve exibir `Task.parent` (decisão de UI)

- [ ] O WIP removeu `Task.groupId`/`Task.groupName` e introduziu `parent?: ParentRef`
      (`{ type: 'group'; id: GroupId } | { type: 'task'; id: TaskId }`). Hoje o TaskCard
      acessa os campos antigos. Definir a representação visual do grupo/subtask no card:
      breadcrumb, badge, subtexto "em <grupo>", tooltip com `groupId`?
- [ ] Grupo com `groupName: null` — mostrar o id opaco (`g-...`) como fallback ou nada?
- [ ] Subtarea (`parent.type === 'task'`) tem visual diferente de grupo?

### 2. Onipresença dos campos de grupo no modelo (decisão de modelagem)

- [ ] Confirmar que `groupId`/`groupName` saem **realmente** do `Task` (breaking) ou se voltam
      como campos de conveniência derivados de `parent` apenas no nível do dashboard
      (view model), mantendo o domínio com `parent` apenas
- [ ] Onde fica a fonte da verdade da hierarquia: na `Task` (referência ao pai) ou na árvore
      de priorização (`PriorityNode`)? O `parent` em `Task` é redundante com a árvore ou é a
      primária?

### 3. Semântica dos ids (decisão de domínio, já sinalizada na task-032)

- [ ] Os ids reais são sequenciais (`001`) mas o schema de domínio branda como UUID. Decidir:
      id é uuid ou sequência? Impacta `taskId()`/`groupId()` e o que cada provider emite
- [ ] Os helpers `taskId()`/`groupId()` moram em `design-vue/src/types/index.ts` — devem
      subir para `@opentask/taskin-types-ts` para o resto do monorepo usar? (evitar que cada
      pacote invente o próprio cast)

### 4. Consistência da migração nos testes/mocks

- [ ] O `use-prioritization.mock.ts` e os specs (`Dashboard.spec.ts`, `PrioritizationPage.spec.ts`,
      `use-prioritization.test.ts`) precisam adotar os helpers `taskId()`/`groupId()` em vez de
      cast espalhado; decidir o padrão único (helper vs `as` cast) para o repo
- [ ] Geração de `groupId` aleatória (`g-${Math.random()...}`) é aceitável em produção ou
      precisa de id determinístico/idempotente (importância p/ undo/redo e snapshots)?

### 5. Ordem do diff-asc entre grupos e tarefas soltas (2 testes storybook vermelhos)

- [ ] O rework WIP (migração `groupId/groupName → Task.parent`) deixou 2 testes storybook
      vermelhos no working tree (no HEAD passavam: 37/37):
      - `src/components/templates/PrioritizationScreen.stories.ts > Default` (array `ids.slice(0, 5)`):
        esperado `['002','003','001','005','004']`, recebido `['002','001','005','003','004']`
        (o `003` do grupo g1 caiu para depois das soltas 001/005)
      - `src/components/pages/PrioritizationPage.stories.ts > Group Drag Interactions`
- [ ] Decidir a semântica de ordenação `diff-asc` intercalando grupo × soltas: o grupo deve ser
      rankeado pelo **máximo** do diff dos filhos (comportamento esperado pelo teste) ou de outra
      forma (média/soma/min)? A mudança intencional no rework é possível, nesse caso os stories
      precisam ser atualizados; senão é regressão do WIP a corrigir
- [ ] Confirmar coerência: `exportJson`/`exportTreeJson` (a árvore) vs lista flat no snapshot —
      o diff usa `parentId` agora; garantir que a agregação do diff do grupo usa os mesmos dados

## Notes

- Migração em andamento: `packages/design-vue/src/types/index.ts` (branded types + `ParentRef`)
  e o restante do WIP `feat/task-032` estão sendo concluídos mecanicamente em paralelo
  (task-033 -> tasks de implementação).
- Ver task-032 Notes: "O brand do TaskId continua quebrado… decidir se id é uuid ou sequência
  é modelagem de domínio, não limpeza."
- Esta task é só de decisões; a conclusão mecânica NÃO deve ficar presa nela.
