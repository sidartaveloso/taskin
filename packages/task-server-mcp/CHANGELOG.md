# @opentask/taskin-task-server-mcp

## 0.2.3

### Patch Changes

- 8cd28f3: Dependências de runtime sobem para as versões sem alerta conhecido:
  `@modelcontextprotocol/sdk` de `^1.6.0` (resolvia 1.25.3) para `^1.30.0`, e
  `express` de `^4.21.2` para `^5.2.1`.
  
  Com as duas no lugar, os transitivos passam a resolver sozinhos nas versões
  corrigidas — `hono` 4.13.7, `@hono/node-server` 2.1.1, `fast-uri` 3.1.7,
  `path-to-regexp` 8.4.2, `body-parser` 2.3.0 e `qs` 6.16.0 — e o `pnpm audit`
  deixa de apontar qualquer coisa no caminho de runtime dos pacotes publicados.
  
  O caminho curto seria `overrides` no workspace, e ele **não funcionaria para
  quem instala**: override vale só para a árvore do repositório que o declara.
  Quem consome o `taskin` resolve os próprios transitivos a partir do que os
  nossos `package.json` declaram — por isso a correção teve que ser nas
  dependências diretas.
  
  ## Sobre o express 5
  
  O CLI usa express de forma mínima: `express()`, três middlewares, um
  `express.static` e um catch-all 404. Nenhuma rota com padrão (`:param`, `*`),
  que é onde o `path-to-regexp` 8.x — a mudança mais dura do express 5 —
  quebraria. Nenhuma linha de código precisou mudar.
  
  Verificado com o dashboard no ar, e não só pelos testes (que mockam `http`):
  página inicial com o WebSocket injetado, assets estáticos com o content-type
  certo, 404 em rota inexistente, dotfiles negados, cabeçalhos de segurança
  presentes e `X-Powered-By` ausente.
- Updated dependencies [17c6fbe]
- Updated dependencies [d2b06d2]
  - @opentask/taskin-file-system-provider@3.2.2

## 0.2.2

### Patch Changes

- Updated dependencies [46f8ca4]
- Updated dependencies [2c1e9d9]
- Updated dependencies [2c402e9]
  - @opentask/taskin-file-system-provider@3.2.1
  - @opentask/taskin-types@2.1.1
  - @opentask/taskin-task-manager@3.0.2

## 0.2.1

### Patch Changes

- Updated dependencies [346f1d4]
  - @opentask/taskin-file-system-provider@3.2.0
  - @opentask/taskin-types@2.1.0
  - @opentask/taskin-task-manager@3.0.1

## 0.2.0

### Minor Changes

- b4b259e: Faz a marca `TaskId` valer algo e passa a validar id na borda.
  
  `TaskIdSchema` exigia `.uuid()`, mas id de task é a parte numérica do nome do
  arquivo — `task-020-foo.md` produz `020`. Nenhuma task real passava no schema:
  `TaskSchema.safeParse({ id: '020' })` falhava com "Invalid uuid", e o único
  caminho até um `TaskId` era `satisfies string as TaskId`, um cast. Uma marca que
  só se alcança por cast não carrega informação: custa cast em toda fronteira e
  não previne nada.
  
  ## Ids
  
  - `TaskIdSchema` passa a exigir `/^\d+$/`, a forma que o provider produz.
  - `parseTaskId` e `parseGroupId` são o único caminho suportado até as marcas —
    eles validam e lançam. Os casts saíram do provider.
  - `groupId` no `TaskSchema` passa a ser `GroupId`, marca que já existia e não era
    usada no domínio.
  
  Ao trocar a regex, **11 testes do `types-ts` quebraram de uma vez** — todos por
  fixture de UUID. As fixtures agora usam ids de verdade e o UUID entra como caso
  rejeitado.
  
  ## Contrato
  
  `findTask`, `startTask`, `pauseTask`, `finishTask` e `reviewTask` passam a
  receber `TaskId` em vez de `string`, em `ITaskProvider`, `ITaskManager`, na
  classe `TaskManager` e no `FileSystemTaskProvider`. Na CLI, `normalizeTaskId` é a
  fronteira: aceita o que a pessoa digita (`20`, `020`, `task-020`), normaliza e
  valida. Substitui o `replace(/^task-/, '').padStart(3, '0')` que estava copiado
  em quatro comandos.
  
  Os membros de `ITaskProvider` e `ITaskManager` passaram a ser propriedades de
  função em vez de métodos. TypeScript trata método como bivariante mesmo sob
  `strictFunctionTypes`, e isso deixava `ITaskProvider<TaskFile>` ser atribuído a
  `ITaskProvider<Task>` — compila e depois quebra em `updateTask`, que abre com
  `fs.readFile(task.filePath)`.
  
  ## Fronteiras que validam
  
  - **WebSocket**: `handleUpdateRequest` fazia `message.payload as TTask` e
    entregava JSON não confiável ao provider. Agora relê a task armazenada e aplica
    só o bloco de priorização, via `applyTaskUpdate` (módulo novo, com teste). Os
    campos são substituídos em bloco de propósito: `JSON.stringify` descarta
    `undefined`, então "desagrupar" chega como chave ausente, não como `null`.
  - **WebSocket e MCP**: id vindo do cliente passa por `safeParse` e devolve erro
    claro, em vez de deixar `ZodError` vazar pelo catch genérico.
  - `getAllTasks` ignora `task-*.md` sem id numérico. Antes viravam task fantasma
    de id `'unknown'` — e duas delas colidiam no mesmo id.
  
  ## Breaking changes
  
  **`@opentask/taskin-types`**
  
  - `TaskIdSchema` rejeita UUID e aceita `/^\d+$/`. Quem persistiu id em outro
    formato não passa mais em `TaskSchema`.
  - `TaskSchema.groupId` é `GroupId`, não `string`.
  
  **`@opentask/taskin-task-manager`**
  
  - Os parâmetros de id são `TaskId`. Um `string` solto não compila mais — use
    `parseTaskId`.
  - `CreateTaskResult.taskId` foi removido: duplicava `task.id` com tipo mais
    fraco. O provider de arquivos segue devolvendo `filePath` em
    `CreateTaskFileResult`.
  - `ITaskProvider` e `ITaskManager` declaram propriedades de função. Classes que
    os implementam continuam compilando; o que deixa de compilar é atribuir um
    provider específico onde se espera o genérico — que era exatamente o bug.
  
  **`@opentask/taskin-design-vue`**
  
  - `TaskId` e `GroupId` são reexportados de `@opentask/taskin-types` em vez de
    redeclarados. Duas marcas para o mesmo conceito obrigavam um cast em toda
    fronteira, e foi um desses casts que engoliu campos calado.
  
  ## API nova
  
  `@opentask/taskin-types` exporta `parseTaskId`, `parseGroupId`,
  `TaskPrioritizationUpdateSchema` (a fatia mutável de uma task, derivada de
  `TaskSchema` para não poder divergir) e `NOTIFICATION_PROVIDERS` /
  `NotificationProviderNameSchema`.
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

### Patch Changes

- Updated dependencies [848ddc0]
- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [2240253]
- Updated dependencies [2f6d046]
- Updated dependencies [714d2cd]
  - @opentask/taskin-file-system-provider@3.1.0
  - @opentask/taskin-types@2.0.0
  - @opentask/taskin-task-manager@3.0.0

## 0.1.9

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-task-manager@2.0.1
  - @opentask/taskin-file-system-provider@3.0.2

## 0.1.8

### Patch Changes

- feat(cli): implement review command with unified hook system

  Add new `taskin review` command to prepare tasks for code review with automated quality checks.

  **New Features:**
  - Add `review` command to transition tasks from in-progress to in-review status
  - Implement unified hook system supporting pre/during/post phases for all commands
  - Add config-manager for .taskin.json hook configuration
  - Add reviewTask() method to TaskManager
  - Add comprehensive TypeScript schemas and types for hooks and configuration

  **UX Improvements:**
  - Standardize --open flag semantics across list and dashboard commands
  - Add --browser/-b flag for launching browser in dashboard
  - Remove redundant --filter-open and --filter-closed flags

  **Build Fixes:**
  - Add composite:true to CLI tsconfig for project references
  - Add @modelcontextprotocol/sdk as direct dependency
  - Fix VS Code TypeScript Language Server cache issues

  **BREAKING CHANGE:**

  The `--open` flag in `taskin dashboard` now filters open tasks (consistent with list command) instead of opening a browser. Use the new `--browser` or `-b` flag to open the browser automatically.

  **New Files:**
  - packages/cli/src/commands/review.ts (321 lines)
  - packages/cli/src/lib/hook-runner.ts (119 lines)
  - packages/cli/src/lib/hook-runner.test.ts (242 lines)
  - packages/cli/src/lib/config-manager.ts (46 lines)
  - packages/types-ts/src/taskin.schemas.ts (+137 lines)
  - packages/types-ts/src/taskin.types.ts (+108 lines)

  Closes #014

- Updated dependencies [9e3e2e4]
- Updated dependencies [9e3e2e4]
- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.2
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0

## 0.1.7

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-file-system-provider@2.2.1
  - @opentask/taskin-task-manager@1.0.9

## 0.1.6

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.0

## 0.1.5

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.1.0

## 0.1.4

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.3
  - @opentask/taskin-task-manager@1.0.8

## 0.1.3

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.2
  - @opentask/taskin-task-manager@1.0.7

## 0.1.2

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.1
  - @opentask/taskin-task-manager@1.0.6

## 0.1.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.0
