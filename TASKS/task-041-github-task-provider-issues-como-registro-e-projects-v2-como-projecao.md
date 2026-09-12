# Task 041 — GitHub task provider: issues como registro e projects v2 como projecao

- Status: pending
- Type: feat
- Assignee: jorisveloso
- Priority: 160

## Description

Implementar `@opentask/taskin-github-provider` — um `ITaskProvider` que cria e atualiza
**GitHub Issues** — e definir o papel do **GitHub Projects v2** na representacao dos campos
que a issue nao tem onde guardar (status estendido, ordem manual, agrupamento, dificuldade).

O desbloqueio no CLI saiu para a task-043: hoje **nao existe factory de provider** e o
`provider.type` do `.taskin.json` e lido apenas pelo `init`, o que deixou a task-002 (Redmine)
parada em `paused` mesmo com a spec pronta.

Complementa a task-031 (que tornou o `ITaskManager` agnostico ao provedor) e a task-002 (mesmo
molde de provider externo via API). O registro do CLI ja reserva o id: `github`, pacote
`@opentask/taskin-github-provider`, config `owner`/`repo`/`token`, status `coming-soon`
(`packages/cli/src/lib/provider-registry/provider-registry.ts`).

## Decisao de design: Issues ou Projects v2?

**Analise:** as duas coisas nao competem — cobrem partes diferentes do contrato. A `Task` do
Taskin tem 7 status (`pending`, `in-progress`, `paused`, `in-review`, `done`, `blocked`,
`canceled`) mais os campos de priorizacao (`order`, `groupId`, `groupName`, `difficulty`) que o
quadro do dashboard escreve via WebSocket (`TaskPrioritizationUpdateSchema`). Uma issue tem
`state` binario (`open`/`closed`), nao tem ordem estavel e nao tem campos tipados.

| Campo da `Task`                | Issue (nativo)                     | Projects v2                      |
| ------------------------------ | ---------------------------------- | -------------------------------- |
| `id` (`/^\d+$/`)               | `number` — encaixa direto          | item id e opaco (nao serve)      |
| `title`, `description`         | `title`, `body`                    | —                                |
| `assignee`                     | `assignees[]`                      | campo custom                     |
| `createdAt`                    | `created_at`                       | —                                |
| `type` (6 valores)             | label (`type/feat`)                | single-select                    |
| `status` (7 valores)           | **nao cabe** (open/closed) → label | **single-select "Status"**       |
| `order` (drag-and-drop)        | **nao cabe**                       | **posicao do item / Number**     |
| `groupId` / `groupName`        | **nao cabe**                       | **Text / single-select**         |
| `difficulty` (1-5)             | **nao cabe**                       | **Number**                       |
| comentarios, link com PR/commit| nativo (essencial p/ metricas git) | so via issue                     |

**Decisao proposta (validar antes de codar):** issue e o registro (*system of record*),
Projects v2 e uma **projecao opcional**.

- **Fase 1 — so Issues.** Status e tipo em labels (`taskin/status:in-progress`,
  `taskin/type:feat`); `order`/`groupId`/`groupName`/`difficulty` num bloco de metadados em
  comentario HTML no fim do `body` (invisivel no render, ida e volta preservada). Funciona em
  qualquer repo, sem setup, com REST + `gh`, e sem escopo `project` no token.
- **Fase 2 — Projects v2 opcional.** Com `project` configurado, o Status single-select e a
  posicao do item passam a ser a fonte de verdade desses campos e o bloco de metadados no body
  deixa de ser escrito. Custo real: Projects v2 **so tem GraphQL** (nao ha REST), exige escopo
  `project` no token e, em projeto de organizacao, costuma exigir aprovacao de admin.

**Autoridade unica, nunca as duas.** Se `project` esta configurado, ele manda no status/ordem e
o provider apenas espelha `open`/`closed` na issue (fecha em `done`/`canceled` com
`state_reason` `completed`/`not_planned`). Sem `project`, as labels mandam. Nao ha merge das
duas fontes — dois donos do mesmo campo e drift garantido.

**Projects v2 sozinho foi descartado:** *draft items* nao tem numero de issue (quebra o
`TaskIdSchema`, que exige `/^\d+$/`), nao tem comentarios e nao linkam com PR/commit — o que
inviabilizaria as metricas do `git-utils`, que amarram commit -> task.

## Dependencia

Bloqueada pela [task-043](./task-043-factory-de-provider-no-cli-e-porta-iuserregistry-agnostica.md)
(factory de provider no CLI + porta `IUserRegistry` no `task-manager`), que era a Fase 0 desta
task. Sem ela, `provider.type: "github"` no `.taskin.json` nao tem efeito: o CLI instancia
`FileSystemTaskProvider` hardcoded em 13 lugares. O pacote da Fase 1 pode ser escrito e testado
em paralelo — o que depende da 043 e so o momento em que o CLI passa a usa-lo de fato.

## Tasks

### Fase 1 — GitHubTaskProvider sobre Issues

- [ ] Criar `packages/github-task-provider` (`@opentask/taskin-github-provider`) espelhando a
      estrutura do fs provider: `github-task-provider.ts`, `.types.ts`, `github-api-client.ts`,
      `issue-mapper.ts`, `task-validator.ts`, `index.ts` + testes irmaos.
- [ ] `GitHubTaskProvider implements ITaskProvider<GitHubTask>`: `initialize` (valida repo/escopos
      e garante as labels `taskin/*`), `findTask`, `getAllTasks`, `updateTask`, `createTask`, `lint`.
      Membros como propriedades de funcao, nao metodos — ver o comentario sobre bivariancia em
      `task-manager.types.ts:85`.
- [ ] Mapeamento issue <-> task nos dois sentidos, com round-trip coberto por teste: numero -> `TaskId`
      via `parseTaskId`, `body` -> `description`, labels -> `status`/`type`, bloco de metadados ->
      campos de priorizacao.
- [ ] `GitHubUserRegistry implements IUserRegistry` resolvendo assignee pelo `assignees[]` da
      issue (o login do GitHub nao e o id do registry), rodando o `runUserRegistryContractTests`
      ja existente. Login desconhecido nao pode derrubar o `getAllTasks`. Avaliar compor com o
      registry file-backed apenas como mapa login -> e-mail: as metricas do `git-utils` casam
      autor de commit por e-mail, e a API do GitHub nem sempre expoe o e-mail do usuario.
- [ ] `lint(fix?)` com regras proprias do provider: issue sem label de status, com duas labels de
      status, label de tipo invalida, issue fechada sem `done`/`canceled`, assignee nao resolvivel.
      Com `fix: true`, corrigir as labels. Retornar `LintResult` usando o `number` da issue no campo
      `file` (ex.: `#1234`).
- [ ] Rede: paginacao completa, `If-None-Match`/ETag com cache local em `.taskin/cache/github/`,
      e um erro claro quando offline ou com rate limit estourado — `getAllTasks()` roda em quase
      todo comando e o dashboard faz polling, entao sem cache isso vira 5000 req/h rapido.
- [ ] Credencial: token via `${GITHUB_TOKEN}` (usando a expansao de `${VAR}` que a task-043
      entrega) ou `gh auth token`. **Nao** aceitar PAT literal no `.taskin.json`, que e versionado
      — falhar com mensagem explicita se o valor parecer um token cru.
- [ ] Destravar o provider no registro do CLI: `coming-soon` -> `stable` no id `github` em
      `provider-registry.ts`, com o `configSchema` ajustado (`token` opcional quando ha `gh`/env,
      `project` opcional) e os prompts do `init` correspondentes.

### Fase 2 — Projects v2 como projecao opcional

- [ ] Config `provider.config.project: { number, statusField?, orderField?, groupField?, difficultyField? }`.
- [ ] Cliente GraphQL: ler/escrever os campos do item (`updateProjectV2ItemFieldValue`), adicionar
      issue nova ao projeto, ler a posicao do item para o `order`.
- [ ] Com `project` presente: Projects e autoridade de status/ordem/grupo/dificuldade; a issue so
      espelha `open`/`closed`. Sem `project`: labels + bloco de metadados. Um teste por modo.
- [ ] Documentar em `docs/` o setup do projeto (campos esperados, nomes default, escopo `project`
      no token e a aprovacao de admin em projeto de org).

## Notes

- **Fronteira do registro de usuarios (decidido):** a porta `IUserRegistry` e agnostica — todo
  provider precisa resolver assignee — mas o arquivo `.taskin/.taskin-users.json` e implementacao
  do provider fs, nao configuracao de projeto. Por isso a validacao/migracao do caminho desse
  arquivo vive no `FileSystemTaskProvider.lint()`/`initialize()` e o provider do GitHub nao herda
  nada disso: num projeto GitHub o arquivo nao existe. A evidencia de que a porta foi desenhada
  para varias implementacoes e o `user-registry.contract.ts`, um contract test parametrizado por
  factory, e o fato de o provider receber o registry injetado no construtor.
- **Fora de escopo, declarar no README do pacote:** metricas. `FileSystemMetricsAdapter implements
  IMetricsManager` le arquivos e git; o equivalente no GitHub sairia do *issue timeline* e nao esta
  nesta task. `taskin dashboard` com provider github deve degradar sem metricas, nao quebrar.
- **Fora de escopo:** sync bidirecional com `TASKS/` (migrar de fs para github, ou espelhar os dois).
  Se aparecer a necessidade, e task separada — a task-040 (mirror S3) e o precedente de formato.
- A antiga Fase 0 virou a task-043 justamente por esse motivo: refactor em codigo existente tem
  risco de regressao no que ja funciona, enquanto Fase 1/2 e pacote novo onde nada quebra se
  estiver errado — perfis de revisao diferentes o bastante para nao dividirem a mesma task.
- **Criterio de aceite:** num repo GitHub limpo, `taskin init -p github` -> `taskin new` cria a issue
  e devolve o numero como id -> `taskin start/pause/review/finish` movem o status (label ou campo do
  projeto) e fecham a issue no `finish` -> `taskin list` e `taskin dashboard` leem do GitHub ->
  `taskin lint` aponta e conserta labels inconsistentes -> tudo isso sem PAT em arquivo versionado.
- Referencias: [task-002](./task-002-add-redmine-support.md) (molde de provider via API, `paused`),
  [task-031](./task-031-revisar-se-task-manager-deveria-lidar-com-taskfile-ou-task.md) (agnosticismo
  do `ITaskManager` — habilitou esta task), [task-005](./task-005-painel-tasks.md) (dashboard),
  [task-019](./task-019-fazer-push-automatico-e-pull-automatico.md) (autoSync git).
- Docs externas: [Issues REST API](https://docs.github.com/en/rest/issues/issues),
  [Projects v2 GraphQL](https://docs.github.com/en/graphql/reference/objects#projectv2),
  [Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects).
