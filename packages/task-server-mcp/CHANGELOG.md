# @opentask/taskin-task-server-mcp

## 0.4.0

### Minor Changes

- adf9cd0: `taskin mcp-server`: the banner no longer goes out over the protocol channel, and the transport option that never existed is gone.
  
  Under the stdio transport, **stdout is the protocol channel** — everything on it is a JSON-RPC message and nothing else. The command was writing its header, its progress lines and its tool list there. It appeared to work because clients discard lines that fail to parse, but tolerance is not correctness. Everything a person reads now goes to stderr, where no protocol travels.
  
  The tool list in that banner was also written by hand, and had already fallen behind: it advertised `start_task` and `finish_task` and forgot `list_tasks`. It is now asked of the server.
  
  `-t, --transport` is removed, and `MCPTransportType` narrows to `'stdio'`. The type accepted `'sse'`, the flag advertised it, and `connect()` answered `Transport sse not yet implemented` — after initialising the provider. An option with no implementation behind it is a defect, not a detail. When a second transport exists, it arrives together with its implementation.

## 0.3.0

### Minor Changes

- 6bebe35: O taskin passa a entregar a lista de tarefas de forma que outra ferramenta
  consuma — `taskin list --json` e `list_tasks` no servidor MCP.
  
  ## O que havia
  
  O `list` só imprimia tabela colorida. O servidor MCP não tinha ferramenta de
  listagem, e o recurso `taskin://tasks` **anunciava** a capacidade e respondia
  com um espaço reservado:
  
  ```json
  {"message": "Task list would be here", "note": "Requires ITaskProvider integration"}
  ```
  
  Pior que não oferecer: quem consome recebe algo com cara de dado.
  
  ## Uma seleção, não três
  
  Havia duas implementações da mesma pergunta, já discordando — o comando `list`
  casava o responsável por substring em nome ou id, e a classe `Taskin` casava
  `userId` exato, além de projetar a task derrubando o `assignee`. A saída em
  JSON e o MCP seriam a terceira e a quarta.
  
  `filterTasks` e `summarizeTask` vivem no pacote agnóstico, e os três caminhos
  perguntam ao mesmo lugar.
  
  ## Detalhes que importam para quem consome
  
  `list --json` sai **sem cabeçalho, moldura ou aviso** — a saída inteira é JSON
  válido, e lista vazia é `[]`. Não carrega `content` nem `description`: o
  provider de arquivos guarda o markdown inteiro neles, e a listagem deste
  repositório passaria de vinte mil linhas. O corpo se busca pelo id.
  
  `getAllTasks` entrou no `ITaskManager`, delegando ao provider como `lint` já
  fazia — era o que faltava para um consumidor que só tem o manager responder
  "que trabalho existe?".
  
  `ListTasksOptions.status` e `.type` passam a usar os tipos do domínio em vez de
  `string`. Um valor fora do conjunto nunca casaria, e falhava em silêncio.
  
  ## Um defeito de transporte, corrigido junto
  
  Exercitando o servidor por stdio, o SDK recusava a resposta com
  `invalid_union: expected string, received array`. O invólucro fazia
  `text: result.content`, embrulhando o arranjo de blocos dentro de um bloco cujo
  `text` precisa ser string — então **`start_task` e `finish_task` nunca
  funcionaram pelo transporte real**. Nenhum teste pegava porque todos chamavam
  `callTool` direto, pulando o invólucro.

### Patch Changes

- aafeae4: A documentação do servidor MCP deixa de anunciar ferramentas que não existem.
  
  Três documentos listavam **seis** ferramentas; o servidor tem **três**.
  `get_task`, `pause_task` e `lint_tasks` nunca existiram, e `list_tasks` era
  documentada desde antes de ser implementada. A documentação andou à frente do
  código por tempo indeterminado, e nada comparava as duas listas.
  
  Corrigidos `docs/MCP_CLAUDE_SETUP.md`, `docs/MCP_VSCODE_SETUP.md` e o README do
  pacote — as três que existem ficam anunciadas, e as três que não existem viram
  uma nota dizendo o que usar no lugar (`taskin pause`, `taskin lint`).
  
  Os recursos também: a lista prometia `task://{taskId}` e
  `tasks://status/{status}`; o que existe é `taskin://tasks`.
  
  ## A guarda
  
  Entra um teste que lê esses três arquivos e compara o que eles **anunciam** —
  título, linha de tabela, item de lista — com o `listTools()` do servidor. Nos
  dois sentidos: nada documentado sem existir, nada implementado sem documentar.
- Updated dependencies [6bebe35]
  - @opentask/taskin-task-manager@3.1.0
  - @opentask/taskin-types@2.2.0
  - @opentask/taskin-file-system-provider@3.2.4

## 0.2.4

### Patch Changes

- Updated dependencies [14c9482]
  - @opentask/taskin-file-system-provider@3.2.3

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
