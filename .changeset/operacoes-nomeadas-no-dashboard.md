---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-task-provider-pinia': minor
'@opentask/taskin-dashboard': patch
'@opentask/taskin-task-server-mcp': patch
'taskin': patch
---

O dashboard passa a gravar pelas mesmas operações nomeadas do `ITaskManager`
que a CLI e o MCP usam, e o servidor WebSocket deixa de aceitar `update`.

- `ITaskManager` ganha `setDifficulty(taskId, difficulty)` — de 1 a 5.
- `SUPERFICIES_DAS_OPERACOES` declara como cada superfície (CLI, MCP,
  WebSocket) expõe cada operação, ou por que não expõe; operação nova sem as
  três decisões não compila. `runTaskManagerContractTests` sai em `./testing`.
- Protocolo WebSocket: `set-priority`, `set-difficulty`, `assign-to-group`,
  `remove-from-group`, `move-before`, `move-after` e `create-group`, atendidas
  na ordem de chegada. `update` e `applyTaskUpdate` foram removidos.
- Store Pinia: `operar(operacao)` manda a operação e já a reflete no cache;
  `updateTask` passa a recusar.
