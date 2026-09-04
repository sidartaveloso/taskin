---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'taskin': major
---

Faz o `provider.type` do `.taskin.json` valer, e move a porta `IUserRegistry`
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
