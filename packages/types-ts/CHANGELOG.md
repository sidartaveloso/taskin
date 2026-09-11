# @opentask/taskin-types

## 2.1.1

### Patch Changes

- 2c402e9: A tag de skip de CI passa a ser `[skip ci]`, e vira configuravel
  
  Os commits que o Taskin escreve sozinho — mudanca de status, arquivo de task —
  vinham marcados com `[skip-ci]`, com hifen. Nenhuma plataforma reconhece essa
  forma: o GitHub Actions documenta cinco strings e essa nao esta entre elas, o
  Bitbucket diz explicitamente que a variante com hifen dispara o pipeline, e o
  GitLab so pula com `[skip ci]` ou `[ci skip]`. Na pratica cada `taskin start`,
  `pause`, `finish` e `review` rodava a CI inteira do projeto de quem usa,
  exatamente o contrario do que a tag prometia.
  
  O padrao agora e `[skip ci]`, a unica forma que as tres plataformas aceitam.
  
  A tag tambem deixou de ser literal espalhada pelo codigo e virou configuracao:
  
  - `taskin init` pergunta qual usar, ou aceita `--ci-skip-tag <tag>`
  - `taskin config --ci-skip-tag <tag>` muda depois, e a secao interativa lista
    as formas documentadas
  - `none` em qualquer um dos dois grava tag vazia, para quem quer que a CI rode
  - uma tag fora da lista e aceita com aviso, nao recusada: Azure DevOps usa
    `***NO_CI***` e um pipeline proprio pode casar o que quiser
  
  O campo e `automation.ciSkipTag` no `.taskin.json`. Quem nao tem o campo recebe
  `[skip ci]` pelo default do schema — nao ha migracao a fazer.
  
  De quebra, `taskin config --discord-webhook` e `--notification-events` voltaram
  a funcionar. O commander entrega as opcoes em camelCase e o comando lia as
  chaves com hifen, entao esses dois flags caiam no modo interativo em vez de no
  proprio ramo.

## 2.1.0

### Minor Changes

- 346f1d4: Três estilos de marcação para o bloco de metadados: leitura tolerante aos três,
  escrita em um só, e conversão explícita entre eles.
  
  ## O defeito que originou
  
  O `4.0.0` escreve a quebra forte do CommonMark (`\`) no fim de **todas** as
  linhas de metadado — a última inclusive. Ali ela não é quebra: não há linha
  seguinte para quebrar, então o renderizador a imprime literal.
  
  ```html
  <p>Status: pending<br> Type: chore<br> Assignee: sidarta-veloso\</p>
  ```
  
  Sempre a linha `Assignee:`. Cosmético — os leitores já faziam `stripHardBreak`,
  então nenhum valor chegava sujo ao domínio — mas visível em qualquer lugar que
  renderize o arquivo.
  
  ## Os três estilos
  
  | id | raw | renderizado |
  | --- | --- | --- |
  | `list` | `- Status: pending` | três linhas |
  | `hard-break` | `Status: pending\` (menos na última) | três linhas |
  | `plain` | `Status: pending` | colapsa numa linha só |
  
  `list` é o novo default: é o único que fica bom no raw e no renderizado ao mesmo
  tempo. Rótulo em negrito com linhas simples foi medido e **não** quebra — colapsa
  igual ao `plain`, o que descarta a alternativa mais óbvia.
  
  ## As três regras
  
  - **Ler é tolerante aos três, sempre.** Isso não é template, é parsing: existem
    arquivos com `\` gravados pelo `4.0.0`, e gente que edita à mão sem marcação
    nenhuma. Vale para o provider, o adaptador de métricas e o linter do CLI.
  - **Escrever preserva o estilo do arquivo que está sendo editado.** Sem isso,
    um `taskin start` num arquivo em `list` com config em `hard-break` deixaria as
    três linhas em estilos diferentes.
  - **A configuração decide só o estilo de arquivo novo**, em
    `provider.config.metadataStyle`. O `taskin init` passa a gravá-lo
    explicitamente, para um upgrade não trocar a marcação de um projeto que nunca
    escolheu.
  
  ## Converter
  
  ```bash
  taskin lint --fix --metadata-style=list
  ```
  
  Sem a flag, `--fix` normaliza cada arquivo **dentro** do estilo que ele já usa —
  o que, para os arquivos gravados pelo `4.0.0`, significa tirar a barra sobrando
  da última linha. A flag exige `--fix`: converter é escrever.
  
  ## O contrato
  
  `MetadataStyle` mora em `metadata-style/`, com as três implementações provando-se
  contra o mesmo `runMetadataStyleContractTests` — inclusive a propriedade que
  teria pego o defeito: ler um bloco em qualquer um dos três estilos devolve o
  mesmo valor, e `format` nunca deixa marcação pendurada na última linha.
  
  O `ITaskProvider` não mudou. Estilo de marcação não significa nada para um
  provider de Jira, então a opção viaja como configuração do provider e não como
  parâmetro de `lint`.
  
  `stripHardBreak` continua exportado e funcionando, para quem já o chama de fora.

## 2.0.0

### Major Changes

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

### Minor Changes

- 2f6d046: `UserSchema` ganha `website`, `github` e `linkedin`, todos opcionais e validados
  como URL.
  
  O `.taskin/README.md` documentava campos de perfil ha tempos e o registro real
  ja os guardava, mas o schema nao os tinha: sobreviviam no arquivo e nenhum codigo
  conseguia le-los com tipo. O `github` interessa em especial ao provider da
  task-041, que precisa casar assignee de issue com usuario do registro.
  
  O README foi alinhado ao schema no mesmo passo: ele listava `discord`, `phone`,
  `role` e `active`, que nunca existiram.

## 1.1.1

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

## 1.1.0

### Minor Changes

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

## 1.0.6

### Patch Changes

- fix(types): add explicit export for TaskinConfigSchema to resolve ESM import error

  Add explicit named export for TaskinConfigSchema to ensure it's available
  in ESM imports. This fixes "does not provide an export named" error.
