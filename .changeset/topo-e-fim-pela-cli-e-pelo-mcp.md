---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-task-provider-pinia': patch
'taskin': minor
---

Levar uma task ao topo ou ao fim da fila sem saber antes qual e a primeira:
`moveToTop` e `moveToBottom` no `ITaskManager`, `taskin priority <task> --top`
e `--bottom`, `top`/`bottom` no `set_priority` do MCP, e `move-to-top` /
`move-to-bottom` no protocolo do servidor WebSocket. Uma task agrupada vai ao
extremo do proprio grupo, como os botoes do dashboard. Topo grava um arquivo;
fim depois de uma cauda sem `Priority` numera a cauda uma vez, e as tres
superficies dizem quantos arquivos foram gravados.
