# Task 031 — revisar se task-manager deveria lidar com taskfile ou task

Status: done
Type: chore
Assignee: A definir

## Description

considerando que o taskin é agnostico em relacao ao provedor que concretiza o registro de uma task, seja em arquivo, como issue do github ou redmine; Deveria o ITaskManager lidar com TaskFile?

Resposta: não — e o vazamento era mais fundo do que o retorno do `ITaskManager`. O
`TaskFile` era *declarado* no pacote agnóstico (`task-manager`), e o `ITaskProvider`
inteiro — a abstração que existe para cobrir fs/github/redmine — era tipado em
`TaskFile`, obrigando qualquer provider não-arquivo a inventar `content` e `filePath`.

Solução: `ITaskProvider` e `ITaskManager` passam a ser genéricos sobre a forma da
task (`TTask extends Task = Task`), e `TaskFile` muda de pacote para o
`file-system-task-provider`, seu único dono legítimo.

## Tasks

- [x] Tornar `ITaskProvider`/`ITaskManager`/`CreateTaskResult` genéricos sobre `TTask extends Task = Task`
- [x] Mover `TaskFile` para `file-system-task-provider` (+ `CreateTaskFileResult` com `filePath`)
- [x] Remover `filePath` do `CreateTaskResult` agnóstico
- [x] Remover o strip em runtime (`toTask`) do `TaskManager` e a cópia dele no mock do MCP
- [x] Corrigir broadcast do WS que podia emitir `payload: undefined` após start/finish
- [x] `task-provider-pinia` e dashboard passam a falar `Task` (sem `content`/`filePath`)
- [x] `FileSystemTaskProvider` projeta `content` em `description` na fronteira
- [x] Teste cobrindo preservação de campos específicos do provider numa transição
- [x] `paused` vira status de primeira classe: adicionado a `TASK_STATUSES`, com
      `ITaskManager.pauseTask` e retomada via `startTask`
- [x] Unificar as 4 listas de status divergentes, todas derivando de `TASK_STATUSES`
- [x] Alinhar o `TaskStatus` do design-vue com o domínio e travar o drift no
      dashboard com um `Record` exaustivo (substituindo o `as TaskStatus`)

## Notes

- O `TaskId` é branded como `z.string().uuid()`, mas os ids reais são sequenciais
  (`001`), então todo provider faz `satisfies string as TaskId`. O brand não está
  pagando aluguel — decidir se id é uuid ou sequência é assunto de outra task.
- `description` recebe o markdown inteiro do arquivo, que é exatamente o que o
  dashboard já fazia (`description: taskFile.content`). Extrair só a seção
  `## Description` seria mudança de comportamento, não deste refactor.
- O `paused` não existia no domínio: o `pause` gravava `pending`, perdendo a
  distinção entre "nunca começou" e "começou e parou". Agora é status próprio, e
  as quatro listas de status mantidas à mão (schema, linter da CLI,
  `task-validator`, metrics adapter) derivam todas de `TASK_STATUSES`.
- Efeito colateral daquela divergência: `in-review` — status que o próprio
  `reviewTask` grava — era rejeitado pelo linter, ignorado pelo metrics adapter e
  sumia tanto de `taskin list --open` quanto de `--closed`. Corrigido junto.
- O design-vue segue sem depender de `@opentask/taskin-types` — é um design system
  desacoplado de propósito. O acordo entre os dois unions de status é feito no
  `App.vue`, que é a ponte real, por um `Record<TaskStatus, number>` indexado com
  o status vindo do store: falta de chave pega status novo no domínio, e chave a
  mais pega status novo no design system. Verificado quebrando as duas direções.
