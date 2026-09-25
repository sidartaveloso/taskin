# Changelog

## 0.2.0

### Minor Changes

- 342a312: A listagem mostra so as tarefas abertas por padrao, e `all` mostra todas.
  
  - **Quebra compatibilidade**: `taskin list` (texto e `--json`), `list_tasks` do
    MCP e `filterTasks` sem criterio de status passam a devolver so as abertas
    (pending, in-progress, paused, in-review, blocked). Quem consome `list --json`
    e queria as fechadas passa a pedir `--all`.
  - O padrao mora no dominio: `filterTasks` aplica `effectiveFilterCriteria`
    (exportada), e a CLI, o MCP e o dashboard derivam dele. `status`, `open`,
    `closed` e `active` explicitos desligam o padrao — `--status done` devolve o
    mesmo que antes.
  - Criterio novo `all` no `FilterCriteriaSchema`: flag `--all` na CLI, propriedade
    `all` no `list_tasks`. `parseFilterCriteria` recusa `all` com `open`, `closed`
    ou `active`. `--open` continua aceito, agora redundante.
  - O recurso MCP `taskin://tasks` ("All Tasks") segue trazendo todas.
  - Dashboard: sem `?filter=`, as abertas; um controle na tela alterna entre
    Open, Active, Closed e All (e reescreve a URL), com "Showing N of M tasks".
    `taskin dashboard --all` abre em todas. O contador do quadro passa de "Total"
    a "Shown": conta as visiveis.
- a9343e9: Busca, ordem e pontuação valem para as duas telas do dashboard, pelo domínio e
  na URL.
  
  - `task-manager`: o critério `text` do `filterTasks` casa também o tipo (id,
    título, tipo, status e responsável). `taskin list [filter]` e o `list_tasks`
    do MCP ganham junto.
  - `dashboard`: busca, ordem (`manual`, `diff-desc`, `diff-asc`) e pontuação
    (`scored`/`unscored`) saem da tela de priorização para a barra do topo,
    aplicadas pelo `filterTasks` e pelo `ordenarTarefas`, e ficam na URL como
    `?q=`, `?sort=` e `?score=`. O título do Board segue o recorte (`Open tasks`,
    `Active tasks`, `Closed tasks`, `All tasks`).
  - `design-vue`: o `usePrioritization` não filtra nem ordena por conta própria —
    saem `filter`, `scoreFilter`, `setFilter`, `setScoreFilter`, `setSortMode` e o
    tipo `PrioritizationScoreFilter`; a ordem entra por `options.sortMode` (a
    `PrioritizationPage` ganha a prop `sortMode`), e a arvore sai do
    `ordenarTarefas` nos três modos. A `PrioritizationScreen` perde a busca e os
    dois seletores. A ordem deixa de ser guardada no `localStorage`. `TaskGrid`
    ganha `title` e `Dashboard` ganha `gridTitle`.
- eba94c1: Grupos aninhados: um grupo pode estar dentro de outro, ate quatro niveis. O pai
  mora no grupo (`parentId` opcional no `GroupSchema`, gravado no
  `.taskin-groups.json`), e a task continua guardando um grupo so, o mais interno.
  `createGroup(name, { id?, parentId? })`, `nestGroup` e `unnestGroup` entram no
  `ITaskManager` e nas tres superficies: `taskin group create <nome> --parent
  <grupo>` (`add` segue como apelido), `taskin group nest <grupo> <pai>` e
  `taskin group unnest <grupo>`; `create_group`, `nest_group` e `unnest_group` no
  MCP; `create-group` com `parentId`, `nest-group` e `unnest-group` no WebSocket.
  Pai inexistente, ciclo e passar de quatro niveis sao recusados. Apagar um grupo
  sobe os subgrupos para o pai dele. Aninhar e capacidade opcional do registro
  (`IGroupRegistry.setParent?`): sem ela, as tres recusam com
  `NESTING_NOT_SUPPORTED` e o MCP nao anuncia `nest_group` nem `unnest_group`.
  `taskin list` indenta os subgrupos e `taskin list --json` leva a arvore
  (`{ group, tasks, groups }`); `taskin group list` mostra a hierarquia;
  `list_groups` traz o `parentId`; `taskin lint` acusa pai inexistente e ciclo
  como erro, e profundidade acima de quatro como aviso. No quadro, soltar uma task
  sobre outra do mesmo grupo cria um subgrupo de verdade, e soltar um grupo sobre
  outro cria um pai com os dois dentro — gravados pelo dominio, sobrevivem a
  recarregar, e o desfazer cobre o aninhamento.
- d25da57: O quadro de priorizacao move pelas operacoes do dominio, sem numerar sozinho.
  Setas, topo, fim e arrastar emitem um movimento (`onMove` no `usePrioritization`,
  evento `move` na `PrioritizationPage`) com a linha visivel de referencia, e o
  dashboard o manda como `move-before` / `move-after` / `move-group-before` /
  `move-group-after`. O desfazer guarda valores, e nao a arvore: reenvia o valor
  anterior so das tarefas que a operacao alterou. Sai a numeracao propria do
  composable — `renumber` e a opcao `orderStep` deixam de existir.

### Patch Changes

- e7a2eaf: O estado da conexão com o servidor passa a aparecer na barra do topo do
  dashboard, nas duas telas: a priorização grava pelo servidor a cada movimento e
  também precisa mostrar quando a conexão cai.
  
  - `design-vue`: nova molécula `ConnectionStatus` (indicador, texto e botão de
    tentar de novo), usada pelo `DashboardHeader`. `Dashboard`, `DashboardLayout`
    e `DashboardHeader` ganham `showConnection` (padrão `true`), para quem mostra a
    conexão em outro lugar.
- 4e1f3c1: O dashboard passa a gravar pelas mesmas operações nomeadas do `ITaskManager`
  que a CLI e o MCP usam, e o servidor WebSocket deixa de aceitar `update`.
  
  - `ITaskManager` ganha `setDifficulty(taskId, difficulty)` — de 1 a 5.
  - `SUPERFICIES_DAS_OPERACOES` declara como cada superfície (CLI, MCP,
    WebSocket) expõe cada operação, ou por que não expõe; operação nova sem as
    três decisões não compila. `runTaskManagerContractTests` sai em `./testing`.
  - Protocolo WebSocket: `set-priority`, `set-difficulty`, `assign-to-group`,
    `remove-from-group`, `move-before`, `move-after` e `create-group`, atendidas
    na ordem de chegada. `update` e `applyTaskUpdate` foram removidos.
  - Store Pinia: `operar(operacao)` manda a operação e já a reflete no cache;
    `updateTask` passa a recusar. **Quebra compatibilidade**: quem gravava pelo
    `updateTask` precisa passar a `operar` com a operação nomeada.
- f465b41: A tela completa do dashboard — a barra do topo (telas, filtro de status, busca,
  ordem, pontuação, contagem e conexão) e a troca entre o Board e a priorização —
  vira o componente de página `TaskinWorkspace`, em
  `packages/dashboard/src/components/pages/`, com stories e testes.
  
  - Mora no dashboard, e não no design-vue: é a tela desta aplicação, composta
    das peças do design-vue (`Dashboard`, `PrioritizationPage`,
    `ConnectionStatus`). Recebe as tarefas já recortadas, o total, os grupos, a
    conexão e as escolhas atuais por props, e emite cada escolha. Não lê URL nem
    store, e não filtra.
  - O `App.vue` fica só com a ligação ao store, à URL e ao domínio, e saem os
    exemplos do `storybook init` (`src/stories`).
  - As stories do dashboard entram no Storybook da raiz e rodam no `pnpm test`,
    no Chromium. O `test` do pacote deixa de terminar em `|| true`, que engolia
    qualquer falha.
- 9d7746a: O topo do dashboard passa a ser uma linha só, com as telas, o filtro e a
  contagem, em vez de duas barras. A tela escolhida vai para a URL
  (`?view=prioritization`), ao lado do `?filter=`: recarregar a página ou abrir um
  link leva à mesma tela.
- Updated dependencies [342a312]
- Updated dependencies [a9343e9]
- Updated dependencies [e7a2eaf]
- Updated dependencies [eba94c1]
- Updated dependencies [d7a97ad]
- Updated dependencies [f78c212]
- Updated dependencies [4e1f3c1]
- Updated dependencies [7fbe097]
- Updated dependencies [d25da57]
- Updated dependencies [1320e15]
  - @opentask/taskin-task-manager@4.0.0
  - @opentask/taskin-design-vue@0.6.0
  - @opentask/taskin-task-provider-pinia@4.0.0

## 0.1.14

### Patch Changes

- Updated dependencies [9e15f2d]
- Updated dependencies [6dd91b7]
- Updated dependencies [23c11ed]
- Updated dependencies [d68a2f5]
  - @opentask/taskin-design-vue@0.5.0
  - @opentask/taskin-task-manager@3.2.2
  - @opentask/taskin-task-provider-pinia@3.0.6

## 0.1.13

### Patch Changes

- Updated dependencies [37a0b34]
  - @opentask/taskin-design-vue@0.4.0
  - @opentask/taskin-task-manager@3.2.1
  - @opentask/taskin-task-provider-pinia@3.0.5

## 0.1.12

### Patch Changes

- Updated dependencies [d5fafdd]
- Updated dependencies [f84d9c6]
- Updated dependencies [9d11a3d]
- Updated dependencies [6e1c7fa]
- Updated dependencies [93a60fe]
- Updated dependencies [0aa99db]
  - @opentask/taskin-task-manager@3.2.0
  - @opentask/taskin-design-vue@0.3.3
  - @opentask/taskin-task-provider-pinia@3.0.4

## 0.1.11

### Patch Changes

- @opentask/taskin-task-provider-pinia@3.0.3
  - @opentask/taskin-design-vue@0.3.2

## 0.1.10

### Patch Changes

- Updated dependencies [03044a0]
- Updated dependencies [2d056d5]
- Updated dependencies [b15cb26]
- Updated dependencies [3109949]
- Updated dependencies [042ef23]
- Updated dependencies [f5816b7]
  - @opentask/taskin-design-vue@0.3.1
  - @opentask/taskin-task-provider-pinia@3.0.2

## 0.1.9

### Patch Changes

- db78e50: Padroniza em ingles o texto que o usuario le nos componentes.
  
  Continuando a padronizacao do `ui-sense`, agora nos componentes do produto:
  
  - `TaskCard`: o mapa de status ("Pendente", "Em Progresso", "Pausada",
    "Em Revisão", "Concluída", "Bloqueada", "Cancelada"), o titulo
    "Progresso Diário" e os rotulos de data "Prazo:" e "Início:"
  - `TaskGrid`: os rotulos das estatisticas
  - `PriorityGroupRenderer`: os `title` dos botoes de mover, agrupar e desagrupar,
    que sao tooltip e portanto texto visivel
  - `PrioritizationScreen`: o `aria-label` do seletor de modo, as opcoes de
    ordenacao, o rotulo "Ícones" e o aviso de lista vazia
  - `dashboard`: a aba "Priorização" e os textos de status da conexao
  
  Ficam de proposito em portugues: comentarios de codigo, a documentacao das
  stories e os arquivos de `TASKS/`. Comentario em portugues e a convencao do
  repositorio, e traduzi-los seria um diff enorme sem ganho para quem usa o
  produto.
- Updated dependencies [0dec82a]
- Updated dependencies [ca24c91]
- Updated dependencies [db78e50]
- Updated dependencies [27e758a]
- Updated dependencies [3db9df0]
  - @opentask/taskin-design-vue@0.3.0
  - @opentask/taskin-task-provider-pinia@3.0.1

## 0.1.8

### Patch Changes

- 30b3e4a: Torna o provider e o manager genéricos sobre a forma da task, e promove `paused`
  a status de primeira classe.
  
  ## Provider agnóstico
  
  `TaskFile` era declarado no pacote agnóstico e o `ITaskProvider` inteiro era
  tipado nele, obrigando qualquer provider não-arquivo (GitHub, Redmine) a inventar
  `content` e `filePath`. Agora `ITaskProvider` e `ITaskManager` são genéricos sobre
  `TTask extends Task`, com default `Task`, e `TaskFile` mora no
  `file-system-task-provider`.
  
  Os call sites não mudam — `new TaskManager(provider)` infere a forma sozinho.
  
  Junto disso:
  
  - o strip em runtime (`toTask`) saiu do manager; campos específicos do provider
    agora sobrevivem às transições de status
  - corrigido broadcast do WebSocket que podia emitir `payload: undefined` após
    start/finish, deixando os clientes dessincronizados sem erro nenhum
  - `pinia` e dashboard passam a falar `Task`; o provider de arquivos projeta
    `content` em `description` na fronteira
  
  ## Status `paused`
  
  O comando `pause` gravava `pending`, apagando a diferença entre "nunca começou" e
  "começou e parou". Agora `paused` existe no domínio, com `ITaskManager.pauseTask`
  e retomada via `startTask`.
  
  As quatro listas de status que eram mantidas à mão (schema, linter da CLI,
  `task-validator`, metrics adapter) agora derivam de `TASK_STATUSES`. A divergência
  entre elas já era bug: `in-review`, que o próprio `reviewTask` grava, era
  rejeitado pelo linter, ignorado pelo metrics adapter e sumia tanto de
  `taskin list --open` quanto de `--closed`.
  
  ## Breaking changes
  
  **`@opentask/taskin-task-manager`**
  
  - `ITaskProvider` e `ITaskManager` ganharam parâmetro de tipo. O default mantém o
    uso comum compilando, mas quem *implementa* `ITaskManager` precisa adicionar
    `pauseTask`.
  - `TaskFile` saiu daqui. Importe de `@opentask/taskin-file-system-provider`.
  - `CreateTaskResult` não tem mais `filePath`. O provider de arquivos devolve
    `CreateTaskFileResult`, que o mantém.
  
  **`@opentask/taskin-types`**
  
  - `TaskStatus` e `TASK_STATUSES` ganharam `'paused'`. Consumidores exaustivos
    (`Record<TaskStatus, T>`, `switch` sem `default`) precisam tratar o caso novo.
  
  **`@opentask/taskin-design-vue`**
  
  - `TaskStatus` ganhou `'in-review'` e `'canceled'` para alinhar com o domínio,
    com o mesmo efeito sobre consumidores exaustivos.
  
  **`@opentask/taskin-task-provider-pinia`**
  
  - O store guarda `Task` em vez de `TaskFile`: `tasks`, `findTask`, `getAllTasks` e
    `updateTask` não expõem mais `content` nem `filePath`. Use `description`.
  
  **`@opentask/taskin-task-server-ws`**
  
  - `TaskWebSocketServer` e `TaskServerConfig` ganharam parâmetro de tipo (com
    default). `MockTaskProvider` recebe `Task[]` em vez de `TaskFile[]`.
  
  **`@opentask/taskin-task-server-mcp`**
  
  - `MockMCPTaskManager.getAllTasks()` e `getTask()` devolvem `Task`, sem `filePath`
    nem `content`.
- Updated dependencies [a67d03d]
- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [b4b259e]
- Updated dependencies [6afa684]
  - @opentask/taskin-design-vue@0.2.0
  - @opentask/taskin-task-provider-pinia@3.0.0

## 0.1.7

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-design-vue@0.1.1
  - @opentask/taskin-task-provider-pinia@2.0.1

## 0.1.6

### Patch Changes

- @opentask/taskin-task-provider-pinia@1.0.5

## 0.1.5

### Patch Changes

- @opentask/taskin-task-provider-pinia@1.0.4

## 0.1.4

### Patch Changes

- @opentask/taskin-task-provider-pinia@1.0.3

## 0.1.3

### Patch Changes

- @opentask/taskin-task-provider-pinia@1.0.2

## 0.1.2

### Patch Changes

- @opentask/taskin-task-provider-pinia@1.0.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-provider-pinia@1.0.0

## [0.1.0] - 2025-11-12

### ✨ Added

#### Componentes

- **Atoms**: Badge, Avatar, ProgressBar (3 componentes)
- **Molecules**: TaskHeader, TimeEstimate, ProjectBreadcrumb, DayBar (4 componentes)
- **Organisms**: TaskCard - Integra todos atoms e molecules em um card completo
  - **Abordagem Híbrida**: Aceita objeto `Task` completo OU props individuais
  - Ideal para produção (passar objeto) e Storybook (controles individuais)
- **Templates**: TaskGrid - Layout responsivo com grid de TaskCards
  - Header com estatísticas (total, em progresso, bloqueadas, pausadas)
  - Responsivo: 4 cols → 3 cols → 2 cols → 1 col (baseado em breakpoints)
  - Estados: loading, empty, error
  - Slots customizáveis: title, footer, empty-action
  - Suporte a variante compact dos cards
- Total: **9 componentes** prontos para uso (arquitetura Atomic Design completa)

#### Storybook 10.0.7

- Atualizado para Storybook 10.0.7 (última versão estável)
- **Auto-docs**: Documentação gerada automaticamente
- **Viewports customizados**: Mobile, Tablet, Desktop, TV Display
- **Backgrounds**: 3 temas (light, dark, gray)
- **Controls avançados**: Props ordenadas, expanded por default
- **MDX Introduction**: Página de boas-vindas com overview do projeto
- **Table of Contents**: Índice automático na documentação

#### Configuração

- TypeScript strict mode
- ESLint com Vue 3 + TypeScript
- Vite 6.4.1 para build otimizado
- Provider-agnostic architecture
- Atomic Design pattern

### 📚 Documentação

- README atualizado com guia de uso do Storybook 10
- 13+ stories interativas com exemplos
- Documentação inline em cada story
- Parâmetros documentados com types e defaults

### 🎯 Features do Storybook 10

#### Melhorias de UX

- Layout centralizado por padrão
- Decorators globais com padding
- Controls expandidos automaticamente
- Props obrigatórias aparecem primeiro

#### Documentação

- Table of contents habilitado
- Stories inline na documentação
- Descrições em cada variante
- Controls desabilitados em stories de showcase

### 🏗️ Estrutura

```
packages/dashboard/
├── .storybook/
│   ├── main.ts (configurações avançadas)
│   └── preview.ts (decorators, viewports, backgrounds)
├── src/
│   ├── components/
│   │   ├── atoms/ (Badge, Avatar, ProgressBar)
│   │   └── molecules/ (TaskHeader, TimeEstimate, ProjectBreadcrumb, DayBar)
│   ├── types/ (interfaces TypeScript)
│   └── Introduction.mdx (documentação inicial)
├── public/ (assets estáticos)
└── README.md (guia completo)
```

### 🚀 Próximos Passos

- [ ] Implementar TaskCard organism
- [ ] Criar TaskGrid template
- [ ] Adicionar testes com Vitest
- [ ] Publicar no npm
- [ ] CI/CD com GitHub Actions

### 📝 Notas Técnicas

- Storybook 10 ainda está em transição - alguns addons não têm versões compatíveis
- Removidos testes com `@storybook/test` temporariamente (incompatível com v10)
- Mantido foco em documentação visual via Storybook
- Architecture provider-agnostic mantém flexibilidade máxima
