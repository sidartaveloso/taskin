# taskin

## 4.4.0

### Minor Changes

- 1d44ea5: `taskin user` (alias `users`): list the project's registered users and add new ones from the CLI.
  
  The user registry — `.taskin/.taskin-users.json` — already existed and `init` even told people they could "create users later with the registry commands", but those commands were never there. The only way to see who was registered, or to register someone, was to open the JSON by hand. Half of `lint`'s warnings are about identity ("resolves to nobody in the user registry", "Register them in .taskin/.taskin-users.json") and pointed at a file the CLI gave you no way to edit.
  
  `taskin user list` prints id, name and email. `taskin user add` registers someone from `--id`, `--name` and `--email`, or prompts for whatever is missing. It derives the id from the name when none is given, validates the email through the same `UserSchema` the rest of the system uses, and refuses an id that folds onto one already registered — the folding that makes `Sidarta Veloso` and `sidartaveloso` the same person — so `add` cannot fabricate a second entry for someone already in the directory.
  
  `remove` and `rename` are deliberately left out: changing or dropping an id breaks every `Assignee:` that points at it, so they need to rewrite task files as a side effect, which is a larger, separate change (task-055).

## 4.3.0

### Minor Changes

- 3aab76e: New command: `taskin mcp-install`, which registers the Taskin MCP server in the project's `.mcp.json`.
  
  Writing that file by hand assumes three things that are rarely all true: that the package manager is the same one you use, that the file does not exist yet, and that the command you type actually reaches this project's taskin. The command finds each one out instead of assuming it.
  
  - **Finds the project root**, walking up to `.taskin.json`, so running from `packages/something` still writes to the root — and detects the package manager there, where the lockfile is.
  - **Detects the package manager** from `packageManager` in `package.json`, falling back to the lockfile: pnpm, yarn, bun or npm.
  - **Merges `.mcp.json`** instead of overwriting it: other servers are preserved, an identical entry is a no-op, a different `taskin` entry is reported and left alone until you pass `--force`, and a malformed file is refused without being destroyed.
  - **Starts the server to check the entry works.** This is the part that matters: the probe speaks stdio with the process the entry describes and compares the tools it advertises against the ones this version offers. A command can resolve to a *different* taskin — an older global install will answer happily, with the wrong set of tools — and only that comparison tells the two apart. Skip it with `--no-probe`.
- 37191d4: `--no-skip-ci` on `new`, `start`, `review` and `finish`: write the status commit without the CI-skip tag, for this call only.
  
  The commits Taskin writes on its own carry a tag — `[skip ci]` by default, configurable as `automation.ciSkipTag` — so a status change does not burn a pipeline run. That is right for a push that only changes status.
  
  It is wrong for one case the project-wide setting cannot distinguish. GitHub reads **only the head commit of a push**. When you commit your work and then run `taskin finish`, the status commit lands on top, and its tag skips the whole push — including the release of the work you just finished.
  
  The two workarounds both cost something: pushing the work before running `finish` depends on remembering, and setting `ciSkipTag` to an empty string gives up the benefit on every status commit, forever. A per-call flag settles the one push without touching the default.
  
  It only turns the tag off. There is no way to force it on in a project that configured an empty string — a project that asked for "CI always" has no use for skipping case by case, and an option with no use is a defect.

### Patch Changes

- adf9cd0: `taskin mcp-server`: the banner no longer goes out over the protocol channel, and the transport option that never existed is gone.
  
  Under the stdio transport, **stdout is the protocol channel** — everything on it is a JSON-RPC message and nothing else. The command was writing its header, its progress lines and its tool list there. It appeared to work because clients discard lines that fail to parse, but tolerance is not correctness. Everything a person reads now goes to stderr, where no protocol travels.
  
  The tool list in that banner was also written by hand, and had already fallen behind: it advertised `start_task` and `finish_task` and forgot `list_tasks`. It is now asked of the server.
  
  `-t, --transport` is removed, and `MCPTransportType` narrows to `'stdio'`. The type accepted `'sse'`, the flag advertised it, and `connect()` answered `Transport sse not yet implemented` — after initialising the provider. An option with no implementation behind it is a defect, not a detail. When a second transport exists, it arrives together with its implementation.
- Updated dependencies [adf9cd0]
  - @opentask/taskin-task-server-mcp@0.4.0

## 4.2.0

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

- 8c06be6: A tela de `taskin --help` deixa de esconder quatro comandos.
  
  Ela era uma lista escrita à mão, paralela à que o `index.ts` registra no
  commander, e as duas divergiram: mostrava **10 dos 14** comandos. `review`,
  `stats`, `export` e `notify` existiam, eram testados, e não apareciam para quem
  lia a ajuda — funcionalidade pronta que ninguém descobria.
  
  A lista passa a sair de `program.commands`. Nome, argumentos, aliases, opções e
  descrição vêm de onde o comando já os declarou, então a divergência deixa de
  ser possível.
  
  ## O que continua à mão, e por quê
  
  Os **exemplos** — eles dizem o que vale a pena fazer, não o que é possível, e
  ninguém os deriva. Ficam num mapa indexado pelo nome do comando, e a ausência
  não esconde ninguém: um comando sem exemplo aparece do mesmo jeito, só sem a
  seção.
  
  O ícone deixou de ser mantido à parte: a descrição de cada comando já começa com
  um, e o mapa paralelo imprimia os dois (`🎯 taskin init` seguido de
  `🎯 Initialize Taskin`).
- 79ef2f5: O símbolo da mensagem deixa de aparecer duas vezes.
  
  ```
  ✓ ✓ Created .taskin.json
  ✓ ✓ User "sidartaveloso" (sidartaveloso@gmail.com) created successfully!
  ```
  
  `success`, `error`, `info` e `warning` já prefixam `✓`, `✗`, `ℹ` e `⚠`. Eram 24
  chamadas que passavam a mensagem começando pelo mesmo símbolo, em 8 arquivos —
  `init`, `start`, `pause`, `finish`, `review`, `new`, `dashboard` e
  `mcp-server`.
  
  Nenhum teste percebia, porque nenhum olhava a saída. Entra uma guarda que lê o
  próprio fonte e falha nomeando arquivo e linha: é mais barato que afirmar a
  saída de cada comando, e pega a regressão onde ela nasce.
  
  Os dois `console.error('❌ ...')` do `export` ficam como estão — não passam pelo
  helper, então não duplicam.
- Updated dependencies [aafeae4]
- Updated dependencies [6bebe35]
  - @opentask/taskin-task-server-mcp@0.3.0
  - @opentask/taskin-task-manager@3.1.0
  - @opentask/taskin-types@2.2.0
  - @opentask/taskin-file-system-provider@3.2.4
  - @opentask/taskin-task-server-ws@0.3.3
  - @opentask/taskin-git-utils@3.0.3

## 4.1.4

### Patch Changes

- 58a8b23: A linha de fecho do `lint` deixa de dizer "All task files are valid!" logo
  abaixo de uma lista de avisos.
  
  No código, `valid` significa **zero erros** — aviso não invalida arquivo, e isso
  é deliberado. Mas na tela as duas coisas se contradiziam:
  
  ```
  ⚠ task-013: Task file should have a description section
  ⚠ task-014: Task file should have a description section
  ... mais três
  
  ✅ All task files are valid!
  ```
  
  Quem lê não tem como saber que as duas frases convivem por definição.
  
  Com pendência na tela, a linha passa a dizê-la:
  
  ```
  ✅ No errors — 5 warning(s) and 1 info above, listed for a human to decide.
  ```
  
  Sem pendência nenhuma, a mensagem antiga continua igual. O código de saída não
  muda: aviso nunca fez o comando falhar e continua não fazendo.
  
  ## Um teste que passava por acidente
  
  A asserção do e2e era `expect(stdout).toContain('valid')` — casava com a frase
  inteira e também com a palavra dentro de qualquer outra. Passou a afirmar o que
  importa: que não há erro.

## 4.1.3

### Patch Changes

- Updated dependencies [14c9482]
  - @opentask/taskin-file-system-provider@3.2.3
  - @opentask/taskin-task-server-mcp@0.2.4

## 4.1.2

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
- Updated dependencies [8cd28f3]
- Updated dependencies [d2b06d2]
  - @opentask/taskin-file-system-provider@3.2.2
  - @opentask/taskin-task-server-mcp@0.2.3

## 4.1.1

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
- Updated dependencies [46f8ca4]
- Updated dependencies [2c1e9d9]
- Updated dependencies [2c402e9]
  - @opentask/taskin-file-system-provider@3.2.1
  - @opentask/taskin-git-utils@3.0.2
  - @opentask/taskin-types@2.1.1
  - @opentask/taskin-task-server-mcp@0.2.2
  - @opentask/taskin-task-manager@3.0.2
  - @opentask/taskin-task-server-ws@0.3.2

## 4.1.0

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

### Patch Changes

- Updated dependencies [346f1d4]
  - @opentask/taskin-file-system-provider@3.2.0
  - @opentask/taskin-types@2.1.0
  - @opentask/taskin-task-server-mcp@0.2.1
  - @opentask/taskin-git-utils@3.0.1
  - @opentask/taskin-task-manager@3.0.1
  - @opentask/taskin-task-server-ws@0.3.1

## 4.0.0

### Major Changes

- 2240253: Faz o `provider.type` do `.taskin.json` valer, e move a porta `IUserRegistry`
  para o pacote agnostico.
  
  `provider.type` era lido **apenas** pelo `init`. Todos os comandos instanciavam
  `new FileSystemTaskProvider(...)` e `new UserRegistry(...)` direto, em treze
  lugares, entao escolher outro provider na configuracao nao tinha efeito nenhum —
  foi o que deixou a task-002 (Redmine) parada mesmo com a spec pronta.
  
  ## Factory
  
  `resolveTaskProvider()` (em `packages/cli/src/lib/provider-factory/`) e agora o
  unico lugar que nomeia um provider concreto, e devolve o par provider + user
  registry — os dois eram construidos juntos em cada comando, e drifitaram: `list`
  apontava o registry para a raiz do projeto em vez de `.taskin/`, entao todo
  assignee caia silenciosamente em `createTemporaryUser` e o registro real nunca
  era lido.
  
  O mapa `PROVIDER_BUILDERS` e injetavel, o que da o seam para testar que
  `provider.type` e respeitado sem precisar de um provider real.
  
  `init` e a unica excecao, documentada no codigo: ele roda antes de existir
  `.taskin.json` e e ele quem escreve o `provider.type`, entao usar a factory ali
  seria circular.
  
  ## Porta `IUserRegistry`
  
  A interface era declarada dentro do `file-system-task-provider`, entao qualquer
  registry de outro provider (GitHub, Redmine) teria que importar do provider de
  arquivos para implementa-la — mesmo defeito de fronteira que a task-031 corrigiu
  para o `TaskFile`, na direcao inversa. Agora mora no `task-manager`, ao lado do
  `ITaskProvider`, e o contract test viaja com ela: qualquer implementacao roda
  `runUserRegistryContractTests` via o subpath novo
  `@opentask/taskin-task-manager/testing` (subpath separado para que `vitest` nao
  entre no grafo de import de runtime).
  
  A implementacao file-backed (`UserRegistry`, `users-file-location`,
  `.taskin/.taskin-users.json`) fica onde esta: e backing store de uma
  implementacao, nao configuracao de projeto.
  
  ## Criacao de task sai do comando
  
  `new.ts` tinha uma copia inteira da criacao de task — numeracao `max(ids)+1`,
  slug do titulo, template markdown — que e semantica de sistema de arquivos. Num
  provider remoto o id vem do proprio store (o numero da issue). Agora o comando
  chama `provider.createTask()` e so consome o resultado; o `generateTaskMarkdown`
  duplicado saiu, ficando o do provider, que e i18n-aware.
  
  ## Credencial via ambiente
  
  A config do provider passa por expansao de `${VAR}` (reusando o resolver que a
  config de notificacoes ja usava), porque todo provider remoto precisa de
  credencial e o `.taskin.json` e versionado.
  
  ## Breaking changes
  
  **`taskin`**
  
  - `createTaskin()` e `getTaskin()` agora devolvem `Promise<Taskin>`. Qual
    provider usar e pergunta de runtime, e o user registry precisa ser carregado
    antes de qualquer leitura de task.
  - `provider.type` diferente de `fs` agora **falha com mensagem explicita** em vez
    de silenciosamente usar o provider de arquivos. Quem tinha type errado na
    configuracao passa a ver o erro.
  - `Taskin` recebe `ITaskProvider`/`ITaskManager` em vez de
    `FileSystemTaskProvider`/`TaskManager` concretos.
  
  **`@opentask/taskin-file-system-provider`**
  
  - `IUserRegistry` nao e mais exportada daqui. Importe de
    `@opentask/taskin-task-manager`.
  - `runUserRegistryContractTests` mudou de lugar: importe de
    `@opentask/taskin-task-manager/testing`.
  - `FileSystemTaskProvider` e `FileSystemMetricsAdapter` recebem `IUserRegistry`
    em vez da classe `UserRegistry`.

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
- 714d2cd: Corrige o caminho do registro de usuários e migra projetos que já persistiram o
  padrão errado.
  
  `UserRegistry` lê de `<projeto>/.taskin/.taskin-users.json`, mas
  `FileSystemTaskProvider.initialize()` semeava o arquivo em
  `<projeto>/.taskin-users.json` — na raiz, onde nada o lê. Todo projeto criado com
  `taskin init -p fs` ficava com um arquivo órfão na raiz e um registro vazio: os
  assignees das tasks não resolviam, silenciosamente, e o usuário sintético semeado
  (`$USER` / `<user>@example.com`) nunca aparecia em lugar nenhum.
  
  ## O que mudou
  
  - `initialize()` passa a semear em `.taskin/.taskin-users.json` e migra um arquivo
    legado da raiz, se houver, antes de decidir se falta semear.
  - `lint()` ganhou o par analisador/normalizador para o caminho do registro, no
    mesmo desenho de `validateTaskFile`/`fixTaskFile`: `taskin lint` aponta o
    arquivo fora de lugar e `taskin lint --fix` o move. Arquivo versionado é movido
    com `git mv`, preservando a renomeação no histórico e já deixando a mudança
    staged; sem Git, ou com o arquivo não versionado, cai no rename do sistema de
    arquivos.
  - Quando os dois arquivos existem, o de `.taskin/` é a fonte de verdade e fica
    intocado — o da raiz sai como `.taskin-users.legacy.json`. Nada é mesclado nem
    apagado: mesclar arrastaria de volta o usuário sintético que o `initialize()`
    antigo criava.
  - `initialize()` deixou de usar `process.cwd()` como raiz do projeto e passou a
    derivá-la do diretório de tasks injetado. Com os dois divergindo, ele criava um
    `TASKS/` e um registro fora do projeto que o provider de fato usa.
  - `taskin lint` passou a imprimir avisos e informativos, não só erros. Um registro
    obsoleto na raiz é aviso, e engolir avisos quando o resultado é válido era
    justamente o que mantinha esse problema invisível.
  
  ## API nova
  
  `@opentask/taskin-file-system-provider` exporta `users-file-location`:
  `resolveUsersFilePaths`, `inspectUsersFileLocation`, `validateUsersFileLocation`,
  `fixUsersFileLocation` e as constantes de nome de arquivo. Útil para quem monta o
  provider por conta própria e precisa checar ou corrigir o caminho sem passar pelo
  `lint`.

### Patch Changes

- Updated dependencies [848ddc0]
- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [b4b259e]
- Updated dependencies [2240253]
- Updated dependencies [2f6d046]
- Updated dependencies [714d2cd]
  - @opentask/taskin-file-system-provider@3.1.0
  - @opentask/taskin-types@2.0.0
  - @opentask/taskin-task-manager@3.0.0
  - @opentask/taskin-task-server-ws@0.3.0
  - @opentask/taskin-task-server-mcp@0.2.0
  - @opentask/taskin-git-utils@3.0.0

## 3.0.3

### Patch Changes

- Fix duplicate checkmark in config command success message

  Remove explicit checkmark character from success messages since the success() function already adds one automatically.

## 3.0.2

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-git-utils@2.1.3
  - @opentask/taskin-task-manager@2.0.1
  - @opentask/taskin-file-system-provider@3.0.2
  - @opentask/taskin-task-server-ws@0.2.1
  - @opentask/taskin-task-server-mcp@0.1.9
  - @opentask/taskin-utils@1.1.1

## 2.4.0

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

### Patch Changes

- Updated dependencies [9e3e2e4]
- Updated dependencies [9e3e2e4]
- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.2
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0
  - @opentask/taskin-task-server-mcp@0.1.8
  - @opentask/taskin-task-server-ws@0.1.5
  - @opentask/taskin-git-utils@2.1.2

## 2.3.1

### Patch Changes

- fix(cli): add auto-commit to start command for autopilot mode

  Start command now respects automation level and auto-commits status changes
  when configured (assisted/autopilot modes).

## 2.3.0

### Minor Changes

- feat(cli): implement autopilot auto-commit functionality

  Add automatic git commit functionality to pause and finish commands based on
  automation level configuration. Now autopilot mode actually auto-commits as documented.
  - pause command: auto-commits WIP when automation level allows (assisted/autopilot)
  - finish command: auto-commits status changes and completed work in autopilot mode
  - Graceful fallback to 'assisted' level when config is missing or invalid

## 2.2.2

### Patch Changes

- fix(types): add explicit export for TaskinConfigSchema to resolve ESM import error

  Add explicit named export for TaskinConfigSchema to ensure it's available
  in ESM imports. This fixes "does not provide an export named" error.

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-file-system-provider@2.2.1
  - @opentask/taskin-git-utils@2.1.1
  - @opentask/taskin-task-manager@1.0.9
  - @opentask/taskin-task-server-mcp@0.1.7
  - @opentask/taskin-task-server-ws@0.1.4

## 2.2.1

### Patch Changes

- fix(cli): correct TaskinConfigSchema import to resolve runtime error

  Change from namespace import pattern to direct named import to prevent
  undefined schema error when running config command in production.

## 2.2.0

### Minor Changes

- feat(cli): add config command for automation settings

  Implement `taskin config` command to manage automation levels through CLI.

  **Features:**
  - `taskin config --show` - Display current configuration
  - `taskin config --level <manual|assisted|autopilot>` - Set automation level
  - `taskin config` - Interactive mode with menu selection
  - Input validation and error handling
  - 10 unit tests with full coverage

  **Automation Levels:**
  - `manual` - All commits are suggestions only
  - `assisted` - Auto-commit status changes and pauses (default)
  - `autopilot` - Auto-commit everything

  Closes task-013

## 2.1.0

### Minor Changes

- Normalização de acentos em nomes de arquivos (feat)Pacotes afetados: @opentask/taskin-utils, @opentask/taskin-file-system-provider, taskinImplementada função slugify() que remove acentos de títulos ao criar arquivos de tarefasExemplo: "Configuração inicial" → task-001-configuracao-inicial.mdTítulo original com acentos é preservado dentro do arquivo2. Supressão de sons durante testes (fix)Pacote afetado: taskinSons dos comandos start e finish agora são automaticamente suprimidos quando CI=true ou NODE_ENV=testTestes E2E executam mais rápido e sem interferências3. Correção de dependências workspace (fix)Pacotes afetados: @opentask/taskin-git-utils, @opentask/taskin-file-system-provider, @opentask/taskin-task-manager, taskinMudança de ^1.0.5 para workspace:\* nas dependências de @opentask/taskin-typesGarante uso da versão local durante desenvolvimento e resolução correta no publishTipo de release sugerido: minor (nova feature de normalização de acentos)

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.0
  - @opentask/taskin-utils@1.1.0
  - @opentask/taskin-task-server-mcp@0.1.6

## 2.0.4

### Patch Changes

- Update dependencies to include enhanced team metrics
  - Bump @opentask/taskin-file-system-provider to ^2.1.0
  - Bump @opentask/taskin-git-utils to ^2.1.0
  - Team stats now include all git committers and registry users

## 2.0.3

### Patch Changes

- fix: publish missing packages with incremented versions
- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.3
  - @opentask/taskin-git-utils@2.0.3
  - @opentask/taskin-task-manager@1.0.8
  - @opentask/taskin-task-server-mcp@0.1.4
  - @opentask/taskin-task-server-ws@0.1.3

## 2.0.2

### Patch Changes

- fix: update internal dependencies to latest published versions

## 2.0.1

### Patch Changes

- fix: move internal dependencies from devDependencies to dependencies to ensure they are installed when the package is used

## 2.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.
