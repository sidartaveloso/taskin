# @opentask/taskin-file-system-provider

## 3.2.4

### Patch Changes

- Updated dependencies [6bebe35]
  - @opentask/taskin-task-manager@3.1.0
  - @opentask/taskin-types@2.2.0
  - @opentask/taskin-git-utils@3.0.3

## 3.2.3

### Patch Changes

- 14c9482: `## Status atual` no corpo da task deixa de ser acusado como metadado em seção,
  e travessão passa a contar como "ninguém ainda".
  
  **O falso positivo.** A regra que proíbe metadado em seção testava
  `##\s*Status` contra o **arquivo inteiro**, sem âncora. Qualquer seção cujo
  título começasse com a palavra — `## Status atual`, `## Status do deploy` —
  virava um erro que nenhum `--fix` resolvia: o `fixTaskFile` não migra esses
  (o padrão de migração exige a quebra de linha logo após a palavra), então o
  erro ficava para sempre.
  
  Passa a exigir o cabeçalho **exato**: `## Status`, em qualquer nível. É o texto
  que discrimina, não o nível — `### Status` também é migrado pelo `--fix` e
  segue sendo acusado.
  
  **As barras.** A lista de placeholders aceitava `-`, mas não `–` nem `—`. Quem
  escreve à mão usa o travessão com a mesma intenção, e o valor virava pessoa
  fabricada nas métricas.
  
  Os dois achados vieram de rodar o lint em projetos reais.

## 3.2.2

### Patch Changes

- 17c6fbe: `lint --fix` passa a juntar o bloco de metadados partido também quando a
  marcação já está correta.
  
  O reparo do bloco partido por linha em branco só acontecia se a reemissão
  mudasse alguma linha — na prática, se a última linha tivesse a barra invertida
  sobrando. Num arquivo cujo bloco terminava num campo sem barra:
  
  ```markdown
  # Task 024 — algo
  Priority: 240\
  
  Status: done\
  Type: chore\
  Assignee: Sidarta Veloso\
  Completed: 2026-04-17
  ```
  
  as linhas de metadado já batiam com o formato alvo, a comparação dizia "nada a
  fazer", e a linha em branco no meio sobrevivia. Achado rodando o `--fix` num
  projeto real: 66 de 70 arquivos foram reparados e 4 ficaram para trás,
  exatamente os que terminavam num campo sem marcação.
  
  A comparação passa a levar em conta o intervalo inteiro do bloco — linhas em
  branco incluídas — e não só as linhas de metadado.
- d2b06d2: `não atribuído`, `nao atribuido` e `unassigned` passam a contar como "ninguém
  ainda", e não como uma pessoa.
  
  A lista de placeholders reconhecia `a definir`, `to be defined`, `nome do
  responsável`, `tbd` e `-`. Um assignee fora dela vira **usuário temporário
  fabricado**: aparece com o nome certo na tela, sem e-mail e sem avatar, e conta
  como pessoa separada nas métricas — que é o mesmo defeito que a validação de
  identidade existe para evitar.
  
  Achado num projeto real, onde quatro tasks usavam `não atribuído` e contavam
  como um contribuidor. A forma sem acento entra junto porque as duas convivem em
  arquivo escrito à mão.

## 3.2.1

### Patch Changes

- 46f8ca4: `lint --fix` volta a corrigir a grafia do assignee em arquivos no estilo `list`.
  
  O `fixAssignees` reescrevia a linha por `/^(Assignee:[ \t]*)(.*)$/im`, ancorado
  no início da linha. Num arquivo no estilo `list` a linha é `- Assignee: ...` e o
  padrão nunca casava — então o lint reportava o aviso, sugeria literalmente
  "Rewrite it as `<id>` — lint --fix does this", e não tocava em arquivo nenhum.
  
  Um escritor que ficou para trás quando a leitura passou a aceitar os três
  estilos de marcação. Agora ele escreve pelo mesmo módulo dos demais, e tira o
  rótulo do próprio arquivo: um arquivo em pt-BR diz `Responsável:`, e escrever
  `Assignee:` nele criaria um segundo campo em vez de corrigir o primeiro.
  
  ## Por que passou despercebido
  
  A fixture do teste de integração era `plain` — o único dos três estilos em que
  a regex antiga ainda funcionava. O teste passa a rodar nos três, e afirma
  também que o conserto não troca o estilo do arquivo pelo caminho. Verificado
  que ele falha no caso `list` sem esta correção.
- 2c1e9d9: O bloco de metadados volta a ser lido inteiro quando uma linha em branco o
  parte no meio.
  
  O `setInlineField` até a 4.0.0 inseria um campo novo logo **depois do H1**, antes
  da linha em branco que separava do bloco real. Um arquivo que tenha sido
  priorizado por aquela versão fica assim:
  
  ```markdown
  # 🧩 Task 001 — Alvo
  Priority: 10\
  
  Status: pending\
  Type: feat\
  Assignee: sidarta-veloso\
  ```
  
  A 3.2.0 encerrava o bloco na primeira linha em branco, então enxergava só o
  `Priority`. As consequências eram silenciosas e sérias:
  
  - `Status`, `Type` e `Assignee` liam `undefined` — a task caía para `pending` e
    `feat` por default, e o assignee virava usuário temporário fabricado;
  - reescrever o status **criava um segundo campo** em vez de atualizar o
    primeiro, deixando dois `Status:` no arquivo.
  
  Agora a varredura atravessa linhas em branco e para na primeira linha que não é
  metadado. As linhas em branco internas caem no intervalo do bloco e somem
  quando ele é reemitido — ou seja, a primeira escrita **repara** o arquivo,
  juntando tudo num bloco só, no estilo que ele já usava.
  
  ## Rótulo precisa começar com letra ou dígito
  
  Para atravessar linha em branco sem engolir o que vem depois, o padrão ficou
  mais estrito: `**Date**: 2026-01-08` e `> **Nota (registro histórico):` não são
  mais reconhecidos como campo. As duas formas existem em arquivos reais, e antes
  seriam reescritas como `- **Date**: ...`.
  
  Campos de rótulo comum continuam valendo, inclusive os ad hoc com espaço
  (`Epic`, `Depends on`) e os localizados (`Responsável`, `Dificuldade`).
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
- Updated dependencies [2c402e9]
  - @opentask/taskin-git-utils@3.0.2
  - @opentask/taskin-types@2.1.1
  - @opentask/taskin-task-manager@3.0.2

## 3.2.0

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
  - @opentask/taskin-types@2.1.0
  - @opentask/taskin-git-utils@3.0.1
  - @opentask/taskin-task-manager@3.0.1

## 3.1.0

### Minor Changes

- 848ddc0: Faz o `lint` acusar assignee que nao resolve, e o relatorio de time contar uma
  pessoa uma vez.
  
  Enquanto o `list` lia o registro de usuarios do diretorio errado, todo assignee
  sem correspondencia caia num usuario temporario fabricado: na tela aparecia o
  nome certo, sem e-mail e sem avatar, e nas metricas contava como pessoa
  separada. Ninguem percebia. Neste repo eram 16 arquivos de task, e o
  `stats --team` reportava 9 contribuidores para um time de dois.
  
  ## Identidade decide, nao a grafia
  
  `FileSystemMetricsAdapter` agrupava contribuidor por `assignee.toLowerCase()` da
  string crua do arquivo, entao `Sidarta Veloso`, `sidarta-veloso` e
  `sidartaveloso` eram tres pessoas, com os commits divididos entre elas. Agora o
  valor passa pelo registro antes de virar chave, e autor de commit tambem — o
  commit cai na mesma pessoa que a task mesmo com grafia diferente.
  
  Placeholder (`A definir`, `To be defined`, `Nome do responsavel`, `TBD`, `-`)
  deixou de ser pessoa: e "ninguem ainda". O `createTask` escreve o primeiro deles
  sozinho quando `new` roda sem `-u`, entao ele aparecia como contribuidor. Task
  concluida sem dono continua somando no total do time — deixou de existir como
  pessoa, nao como entrega.
  
  ## Checagens novas no lint
  
  - **Assignee que resolve para ninguem** → aviso. Com `--fix`, a grafia e
    reescrita **somente** quando dobra sobre exatamente um usuario cadastrado
    (`sidartaveloso` -> `sidarta-veloso`). Typo sem correspondencia unica
    (`sidartaeloso`) e nome nao cadastrado ficam no aviso: distancia de edicao
    seria adivinhar a identidade de alguem.
  - **Usuario sintetico orfao** no registro → aviso, sem tocar no dado. Reconhecido
    pela forma exata que o `initialize()` antigo gerava (`<id>@example.com` com o
    nome capitalizado do id), e nao pelo dominio — um `ana-souza` real com e-mail
    `ana@example.com` nao e confundido com ele.
  - **Registro legado estacionado** (`.taskin-users.legacy.json`) → informativo,
    para nao ficar esquecido para sempre.
  
  ## API nova
  
  `assignee-identity`: `classifyAssignee` (uniao discriminada
  `resolved`/`unassigned`/`correctable`/`unknown`), `validateAssignees`,
  `fixAssignees`, `validateSeededUsers` e `foldAssignee`.
  
  ## Quebra de linha dos metadados
  
  As linhas `Status:`/`Type:`/`Assignee:` sao consecutivas e o CommonMark as
  colapsaria num paragrafo so, entao elas carregam uma quebra forte. A marca
  passou a ser a barra invertida (`Status: done\\`) no lugar dos dois espacos no
  fim: aqueles eram invisiveis, o `git diff --check` os acusa como erro e
  `trim_trailing_whitespace` os remove — o `.editorconfig` teve que desligar essa
  regra para `*.md` so por causa deles, e ainda assim apenas 3 das 45 linhas
  `Assignee:` deste repo os seguiam.
  
  A quebra e formatacao, nao valor: `stripHardBreak` e novo e todo leitor de
  metadado passa por ele (provider, metrics adapter, validator e o linter da CLI),
  aceitando tambem a forma antiga para que arquivos ainda nao normalizados
  continuem sendo lidos. Sem isso, `Status: pending\\` deixaria de ser um status
  valido.
  
  `taskin lint --fix` normaliza os arquivos existentes — o que reescreve a linha de
  metadados de toda task ainda na convencao antiga.
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

- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [b4b259e]
- Updated dependencies [2240253]
- Updated dependencies [2f6d046]
  - @opentask/taskin-types@2.0.0
  - @opentask/taskin-task-manager@3.0.0
  - @opentask/taskin-git-utils@3.0.0

## 3.0.2

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-git-utils@2.1.3
  - @opentask/taskin-task-manager@2.0.1
  - @opentask/taskin-utils@1.1.1

## 2.2.2

### Patch Changes

- 9e3e2e4: fix: add explicit type for commit parameter in file-system-metrics-adapter

  Resolved TypeScript TS7006 error by importing GitCommit type from @opentask/taskin-types and adding explicit type annotation to the commit parameter in the reduce callback.

- 9e3e2e4: build: ensure git-utils and task-manager are built before file-system-provider

  Added explicit build dependency configuration in turbo.json to prevent TS6305 errors caused by race conditions during parallel builds.

- Updated dependencies
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0
  - @opentask/taskin-git-utils@2.1.2

## 2.2.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-git-utils@2.1.1
  - @opentask/taskin-task-manager@1.0.9

## 2.2.0

### Minor Changes

- Normalização de acentos em nomes de arquivos (feat)Pacotes afetados: @opentask/taskin-utils, @opentask/taskin-file-system-provider, taskinImplementada função slugify() que remove acentos de títulos ao criar arquivos de tarefasExemplo: "Configuração inicial" → task-001-configuracao-inicial.mdTítulo original com acentos é preservado dentro do arquivo2. Supressão de sons durante testes (fix)Pacote afetado: taskinSons dos comandos start e finish agora são automaticamente suprimidos quando CI=true ou NODE_ENV=testTestes E2E executam mais rápido e sem interferências3. Correção de dependências workspace (fix)Pacotes afetados: @opentask/taskin-git-utils, @opentask/taskin-file-system-provider, @opentask/taskin-task-manager, taskinMudança de ^1.0.5 para workspace:\* nas dependências de @opentask/taskin-typesGarante uso da versão local durante desenvolvimento e resolução correta no publishTipo de release sugerido: minor (nova feature de normalização de acentos)

### Patch Changes

- Updated dependencies
  - @opentask/taskin-utils@1.1.0

## 2.1.0

### Minor Changes

- Include all git authors and registry users in team metrics
  - Team metrics now aggregate all git committers in the period
  - Include all registered Taskin users even if they have no tasks
  - Fix git command execution issues with quoted parameters
  - Accept abbreviated git hashes (6-40 chars)
  - Increase git command timeout to 30s

### Patch Changes

- Updated dependencies
  - @opentask/taskin-git-utils@2.1.0

## 2.0.3

### Patch Changes

- fix: publish missing packages with incremented versions
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.3
  - @opentask/taskin-task-manager@1.0.8

## 2.0.2

### Patch Changes

- fix: replace workspace:\* dependencies with actual npm versions
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.2
  - @opentask/taskin-task-manager@1.0.7

## 2.0.1

### Patch Changes

- chore: publish packages required by taskin CLI
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.1
  - @opentask/taskin-task-manager@1.0.6

## 2.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.

### Patch Changes

- Updated dependencies
  - @opentask/taskin-git-utils@2.0.0
