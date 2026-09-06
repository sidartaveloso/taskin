---
'@opentask/taskin-types': major
'@opentask/taskin-task-manager': major
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-design-vue': minor
'taskin': minor
---

Faz a marca `TaskId` valer algo e passa a validar id na borda.

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
