---
'@opentask/taskin-task-manager': major
'@opentask/taskin-task-provider-pinia': major
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-design-vue': minor
'@opentask/taskin-types': major
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-dashboard': patch
'taskin': minor
---

Torna o provider e o manager genéricos sobre a forma da task, e promove `paused`
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
