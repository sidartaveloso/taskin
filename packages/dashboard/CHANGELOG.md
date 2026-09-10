# Changelog

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
