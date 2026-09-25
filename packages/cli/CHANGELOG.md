# taskin

## 5.0.0

### Major Changes

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

### Minor Changes

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
- f78c212: Mover um grupo inteiro fora do dashboard: `moveGroupBefore`, `moveGroupAfter`,
  `moveGroupToTop` e `moveGroupToBottom` no `ITaskManager`, `taskin group move
  <grupo> --top | --bottom | --before <task-ou-grupo> | --after <task-ou-grupo>`,
  a ferramenta `move_group` no MCP, e `move-group-before` / `move-group-after` /
  `move-group-to-top` / `move-group-to-bottom` no protocolo do servidor WebSocket.
  Os membros vao juntos, na ordem em que estavam, e so eles sao gravados — um
  grupo de tres grava tres; as tres superficies dizem quantos arquivos gravaram.
- 7fbe097: Pontuar a dificuldade pela CLI e pelo MCP: `taskin difficulty <task> <1-5>`,
  `taskin new --difficulty <1-5>` (conferido antes de criar o arquivo) e a
  ferramenta `set_difficulty` no MCP. O `task-manager` exporta
  `validarDificuldade`, `DIFICULDADE_MINIMA` e `DIFICULDADE_MAXIMA`, com a faixa
  perguntada ao schema. Nao ha como tirar a dificuldade: corrige-se pontuando de
  novo.
- 1320e15: Levar uma task ao topo ou ao fim da fila sem saber antes qual e a primeira:
  `moveToTop` e `moveToBottom` no `ITaskManager`, `taskin priority <task> --top`
  e `--bottom`, `top`/`bottom` no `set_priority` do MCP, e `move-to-top` /
  `move-to-bottom` no protocolo do servidor WebSocket. Uma task agrupada vai ao
  extremo do proprio grupo, como os botoes do dashboard. Topo grava um arquivo;
  fim depois de uma cauda sem `Priority` numera a cauda uma vez, e as tres
  superficies dizem quantos arquivos foram gravados.

### Patch Changes

- 11a6f20: O `Assignee:` passa a guardar o id do registro, e não o nome de exibição.
  
  `taskin new -u <id>` gravava o nome de exibição do usuário, e o `taskin lint` não
  acusava, porque a resolução também casa pelo nome. Agora o `createTask` grava o
  id (recebendo o id ou o nome); quem não está no registro fica como foi digitado.
  O `taskin lint` avisa quando o `Assignee:` é o nome de exibição, e o
  `taskin lint --fix` o reescreve para o id. A leitura continua aceitando o nome,
  para que arquivos antigos sigam resolvendo até o `--fix` rodar.
- 9d292f1: Os commits automáticos passam a levar só o que a mensagem diz.
  
  O commit de status (`start`, `pause`, `finish`, `review` e o `start_task`/
  `finish_task` do MCP) fazia `git add` do arquivo da task e depois `git commit`
  sem caminho, e o `git commit` sem caminho grava o index inteiro: o que a pessoa
  tinha deixado staged ia junto, sob uma mensagem de status. Agora o commit
  recebe os caminhos, e o resto do index fica como estava. O squash do
  `autoSync` tinha o mesmo defeito e a mesma correção.
  
  O commit de trabalho (`pause`, e `finish` em autopilot) ganha
  `GitService.commitWork`: antes do `git add -A`, ele olha cada mudança e recusa
  quando alguma parece sensível — arquivo `.env`, chave privada, arquivo de
  credenciais, ou linha adicionada com um token. Nada é staged; a CLI mostra o
  arquivo, a linha e o motivo. O corpo do commit lista os arquivos.
  
  O git passa a rodar sem shell nesses caminhos: um título de task com aspas ou
  `$(...)` vai literal para a mensagem.
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
- e7a2eaf: O estado da conexão com o servidor passa a aparecer na barra do topo do
  dashboard, nas duas telas: a priorização grava pelo servidor a cada movimento e
  também precisa mostrar quando a conexão cai.
  
  - `design-vue`: nova molécula `ConnectionStatus` (indicador, texto e botão de
    tentar de novo), usada pelo `DashboardHeader`. `Dashboard`, `DashboardLayout`
    e `DashboardHeader` ganham `showConnection` (padrão `true`), para quem mostra a
    conexão em outro lugar.
- d7a97ad: `taskin lint --fix` passa a sair com 1 quando sobra erro que ele não corrige.
  
  Antes, com `--fix`, o comando nunca saía com erro: imprimia o que não tinha
  conseguido corrigir — um anexo acima do teto, por exemplo — e terminava com 0.
  Agora ele corrige o que dá, diz quantos erros restaram e sai com 1.
  
  O `ValidationIssue` ganha `fixable?: boolean`. O validador de anexos marca os
  seus erros como `fixable: false`, e o `taskin lint` sem `--fix` só sugere rodar
  `--fix` quando algum erro pode ser corrigido por ele.
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
- 3244faa: A migração do registro de usuários da 3.x deixa de terminar num commit que remove o registro sem pôr nada no lugar.
  
  Com o arquivo antigo na raiz **e** o canônico em `.taskin/`, o `taskin lint --fix` usava `git mv`
  para levar o da raiz a `.taskin/.taskin-users.legacy.json` — preservando o histórico de um arquivo
  que o passo seguinte mandava apagar — e o canônico, que é o que se lê, continuava fora do Git.
  
  Agora o estacionado sai da raiz por rename comum e fica fora do índice; o que vai para o índice é a
  remoção do arquivo da raiz junto com a adição do canônico, no mesmo commit, que é onde o Git infere
  o rename. O informativo do estacionado diz o que fazer com o Git, e o `taskin lint` avisa quando o
  registro canônico existe mas não está versionado. Projeto sem Git e registro excluído pelo
  `.gitignore` seguem funcionando, sem aviso. Guia em `docs/UPGRADE.md`.
- 9d7746a: O topo do dashboard passa a ser uma linha só, com as telas, o filtro e a
  contagem, em vez de duas barras. A tela escolhida vai para a URL
  (`?view=prioritization`), ao lado do `?filter=`: recarregar a página ou abrir um
  link leva à mesma tela.
- Updated dependencies [342a312]
- Updated dependencies [11a6f20]
- Updated dependencies [9d292f1]
- Updated dependencies [a9343e9]
- Updated dependencies [eba94c1]
- Updated dependencies [d7a97ad]
- Updated dependencies [f78c212]
- Updated dependencies [4e1f3c1]
- Updated dependencies [7fbe097]
- Updated dependencies [3244faa]
- Updated dependencies [1320e15]
  - @opentask/taskin-task-manager@4.0.0
  - @opentask/taskin-task-server-mcp@0.6.0
  - @opentask/taskin-types@2.6.0
  - @opentask/taskin-file-system-provider@3.4.0
  - @opentask/taskin-git-utils@3.1.0
  - @opentask/taskin-task-server-ws@0.4.0

## 4.4.2

### Patch Changes

- Updated dependencies [23c11ed]
  - @opentask/taskin-types@2.5.0
  - @opentask/taskin-file-system-provider@3.3.2
  - @opentask/taskin-git-utils@3.0.6
  - @opentask/taskin-task-manager@3.2.2
  - @opentask/taskin-task-server-mcp@0.5.2
  - @opentask/taskin-task-server-ws@0.3.6

## 4.4.1

### Patch Changes

- Updated dependencies [37a0b34]
  - @opentask/taskin-types@2.4.0
  - @opentask/taskin-file-system-provider@3.3.1
  - @opentask/taskin-git-utils@3.0.5
  - @opentask/taskin-task-manager@3.2.1
  - @opentask/taskin-task-server-mcp@0.5.1
  - @opentask/taskin-task-server-ws@0.3.5

## 4.4.0

### Minor Changes

- d5fafdd: A third filter: `active` — tasks that started and have not finished.
  
  `open` includes `pending`, which is work nobody has begun; on a board you are watching while work happens, that is noise. `status: in-progress` is the opposite problem: a task vanishes the moment someone pauses it or sends it for review. `active` is the middle that was missing — `in-progress`, `paused` and `in-review`.
  
  `blocked` stays out, deliberately: it is work that started, but nobody is moving it right now.
  
  Available as `taskin list --active`, as `active` on the MCP `list_tasks` tool, and as `taskin dashboard --active` / `?filter=active`.
- f84d9c6: Task groups are an entity now: the name lives in one place, and a task carries only the group id.
  
  Until now every member of a group carried its own copy of the name. Renaming meant writing N files with no transaction, so a failure halfway left the group answering to two names — and the write path deleted the name whenever it arrived empty, which is how a real project ended up with four grouped tasks and no name at all.
  
  - **`Group { id, name }`** in `@opentask/taskin-types`, and `groupName` is gone from `Task`.
  - **`IGroupRegistry`** with a contract suite any provider proves itself against. Deleting a group says where its tasks go — `deleteGroup(id, { reassignTo })`, the same shape Redmine and Jira offer — so nothing is ever left pointing at a group that no longer exists.
  - **A provider without groups simply does not expose the registry**, and callers find out by its absence rather than by an operation that fails.
  - **`taskin group`** — `list`, `add`, `rename`, `remove` — plus `list_groups` over MCP, and the dashboard resolving names from the server instead of from each task.
  
  Renaming a three-member group used to be three writes. It is one, and no task file is touched.
- dc34dcf: `ConfigManager.getMascotNoiseSettings()` reads the mascot's ambient-noise block from `.taskin.json`.
  
  The schema and the defaults resolver already existed, and so did the `NoiseWatcher` that reacts to noise above a threshold — but nothing read the block, so the setting existed on paper and not in the product. This is the bridge.
  
  An invalid block falls back to the defaults instead of bringing the command down: people edit that file by hand, and the mascot is no reason for the CLI to stop.
- 9d11a3d: Listings can be ordered: `taskin list --sort <mode>` and a `sort` argument on the MCP `list_tasks` tool, using the same vocabulary the prioritization board already uses — `manual` (by priority), `diff-asc`, `diff-desc`.
  
  Until now `taskin list` returned tasks in whatever order the provider found them, which in practice is by id: the priority column went up and down with no pattern, and whoever read the output had to reorder it in their head. That cost is not hypothetical — an autonomous agent reading the list picked a task with priority 30 while one with 255 sat in the same output.
  
  `taskin list --json` now also emits **groups as groups**. A group node carries its id, its name, the members that matched the filter, and how many the filter left out — so a partial group says so instead of quietly looking whole, and a consumer never has to reimplement the grouping rule to get it back.
  
  Sorting and grouping are separate functions in `@opentask/taskin-task-manager`, so a caller that wants order without grouping gets exactly that.
- 6e1c7fa: Three loose ends closed: duplicate priorities are flagged, the dashboard stops carrying its own copies of the domain rules, and the prioritisation warning reaches the screen.
  
  **`taskin lint` flags duplicate priorities.** Two tasks on the same number corrupt nothing — ordering breaks the tie by input order — but they mean a decision was lost somewhere. It only shows up looking at the whole set, so it is a pass of its own. Absence is not duplication: tasks with no priority are never compared against each other.
  
  **The dashboard consumes the domain rules instead of copying them.** Both the filter sets and the manual sort were byte-for-byte copies living in the Vue packages, because importing the domain package appeared to be blocked by the build. It was not the declaration files: the repo's base config marks every package as a composite project, and a composite project consuming another has to declare the reference. Two lines of configuration.
  
  `ordenarTarefas` now asks for `OrdenavelPorPrioridade` — the two fields it reads — instead of a whole `Task`, which is what lets the board's own view model share the rule.
  
  **The board warns before it costs you.** On a project where only some tasks carry a priority, the first drag rewrites every file above it. The dashboard now says how many are unnumbered and offers to number them once, and the warning disappears when the state it warns about does.
- 93a60fe: A task marked `done` has to say what was actually done.
  
  This comes from a real audit: of eight tasks closed by autonomous agents over two days, **four** read `done` with the whole checklist untouched. In every one of them the work was genuinely finished and covered by tests — but the file showed none of it, so whoever reviewed had nowhere to start. In one, the audit found an item that had in fact **not** been done, hidden among five that had.
  
  Three spellings, and only three: `- [x] item` is done, `- [ ] item` is open, and `- [ ] item — adiado: <reason>` is dropped on purpose, with the decision written down. An empty reason does not count — otherwise the convention would be theatre.
  
  Two places ask for it, and they ask differently. **`taskin finish` warns**: it names the open items and their lines, then closes the task anyway, because finishing is a one-shot gesture and refusing there only teaches people to route around it. **`taskin lint` refuses**: a `done` task with an unjustified open item is an error, and CI is where the demand can afford to be hard. `canceled` is exempt — an abandoned task owes nobody a ticked box.
  
  Both read the checklist through the same parser, so the linter can never refuse what `finish` just accepted. Providers without the concept of a checklist simply do not implement the capability, and close with no gate at all.
  
  Evidence belongs next to the ticked item — a test name, a command, a file — and `TASKS/README.md` now documents the whole vocabulary, including where it came from.
- 0aa99db: `taskin prioritize` gives every task a priority number, once and on purpose — and `prioritize_tasks` does the same over MCP.
  
  A project where only some tasks carry a priority is expensive to reorder: a task with no number sorts last, so giving one to a task in the middle means numbering every task before it. On a 500-task project, moving one from the middle of the unnumbered stretch rewrote **124 files**. After this command, the same move rewrites **one**.
  
  It preserves what you already decided: tasks that carry a number keep it, and the gaps around them are filled. Running it again writes nothing, so it is safe in a script. `--dry-run` reports how many would be numbered without touching anything.
  
  The rule itself lives in one place — `ITaskManager.prioritizeAll()` — so the CLI and the MCP server share it rather than each carrying a copy.
- 1d44ea5: `taskin user` (alias `users`): list the project's registered users and add new ones from the CLI.
  
  The user registry — `.taskin/.taskin-users.json` — already existed and `init` even told people they could "create users later with the registry commands", but those commands were never there. The only way to see who was registered, or to register someone, was to open the JSON by hand. Half of `lint`'s warnings are about identity ("resolves to nobody in the user registry", "Register them in .taskin/.taskin-users.json") and pointed at a file the CLI gave you no way to edit.
  
  `taskin user list` prints id, name and email. `taskin user add` registers someone from `--id`, `--name` and `--email`, or prompts for whatever is missing. It derives the id from the name when none is given, validates the email through the same `UserSchema` the rest of the system uses, and refuses an id that folds onto one already registered — the folding that makes `Sidarta Veloso` and `sidartaveloso` the same person — so `add` cannot fabricate a second entry for someone already in the directory.
  
  After registering someone, `add` reports what the entry changed: how many `Assignee:` values already in use now resolve to it, and which spellings still resolve to nobody and need a cadastro of their own. It also warns when the chosen `--name` leaves a commit-author name off the person: the registry matches commit authors by name, so a name that folds onto the new user but does not resolve to them keeps those commits counting as a separate contributor.
  
  `remove` and `rename` are deliberately left out: changing or dropping an id breaks every `Assignee:` that points at it, so they need to rewrite task files as a side effect, which is a larger, separate change.

### Patch Changes

- Updated dependencies [d5fafdd]
- Updated dependencies [f84d9c6]
- Updated dependencies [9d11a3d]
- Updated dependencies [6e1c7fa]
- Updated dependencies [93a60fe]
- Updated dependencies [0aa99db]
- Updated dependencies [5144b0d]
- Updated dependencies [0f83ec2]
  - @opentask/taskin-task-manager@3.2.0
  - @opentask/taskin-types@2.3.0
  - @opentask/taskin-file-system-provider@3.3.0
  - @opentask/taskin-task-server-mcp@0.5.0
  - @opentask/taskin-task-server-ws@0.3.4
  - @opentask/taskin-git-utils@3.0.4

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
