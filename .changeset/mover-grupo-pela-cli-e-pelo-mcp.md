---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-task-provider-pinia': patch
'taskin': minor
---

Mover um grupo inteiro fora do dashboard: `moveGroupBefore`, `moveGroupAfter`,
`moveGroupToTop` e `moveGroupToBottom` no `ITaskManager`, `taskin group move
<grupo> --top | --bottom | --before <task-ou-grupo> | --after <task-ou-grupo>`,
a ferramenta `move_group` no MCP, e `move-group-before` / `move-group-after` /
`move-group-to-top` / `move-group-to-bottom` no protocolo do servidor WebSocket.
Os membros vao juntos, na ordem em que estavam, e so eles sao gravados — um
grupo de tres grava tres; as tres superficies dizem quantos arquivos gravaram.
