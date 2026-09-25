# @opentask/taskin-task-provider-pinia

## 4.0.0

### Major Changes

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

### Patch Changes

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
- 1320e15: Levar uma task ao topo ou ao fim da fila sem saber antes qual e a primeira:
  `moveToTop` e `moveToBottom` no `ITaskManager`, `taskin priority <task> --top`
  e `--bottom`, `top`/`bottom` no `set_priority` do MCP, e `move-to-top` /
  `move-to-bottom` no protocolo do servidor WebSocket. Uma task agrupada vai ao
  extremo do proprio grupo, como os botoes do dashboard. Topo grava um arquivo;
  fim depois de uma cauda sem `Priority` numera a cauda uma vez, e as tres
  superficies dizem quantos arquivos foram gravados.
- Updated dependencies [342a312]
- Updated dependencies [a9343e9]
- Updated dependencies [eba94c1]
- Updated dependencies [d7a97ad]
- Updated dependencies [f78c212]
- Updated dependencies [4e1f3c1]
- Updated dependencies [7fbe097]
- Updated dependencies [1320e15]
  - @opentask/taskin-task-manager@4.0.0
  - @opentask/taskin-types@2.6.0

## 3.0.6

### Patch Changes

- Updated dependencies [23c11ed]
  - @opentask/taskin-types@2.5.0
  - @opentask/taskin-task-manager@3.2.2

## 3.0.5

### Patch Changes

- Updated dependencies [37a0b34]
  - @opentask/taskin-types@2.4.0
  - @opentask/taskin-task-manager@3.2.1

## 3.0.4

### Patch Changes

- Updated dependencies [d5fafdd]
- Updated dependencies [f84d9c6]
- Updated dependencies [9d11a3d]
- Updated dependencies [6e1c7fa]
- Updated dependencies [93a60fe]
- Updated dependencies [0aa99db]
- Updated dependencies [0f83ec2]
  - @opentask/taskin-task-manager@3.2.0
  - @opentask/taskin-types@2.3.0

## 3.0.3

### Patch Changes

- Updated dependencies [6bebe35]
  - @opentask/taskin-task-manager@3.1.0
  - @opentask/taskin-types@2.2.0

## 3.0.2

### Patch Changes

- Updated dependencies [2c402e9]
  - @opentask/taskin-types@2.1.1
  - @opentask/taskin-task-manager@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies [346f1d4]
  - @opentask/taskin-types@2.1.0
  - @opentask/taskin-task-manager@3.0.1

## 3.0.0

### Major Changes

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

- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [2240253]
- Updated dependencies [2f6d046]
  - @opentask/taskin-types@2.0.0
  - @opentask/taskin-task-manager@3.0.0

## 2.0.1

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-task-manager@2.0.1

## 1.0.5

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0

## 1.0.4

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-task-manager@1.0.9

## 1.0.3

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.8

## 1.0.2

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.7

## 1.0.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.6

## 1.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.
