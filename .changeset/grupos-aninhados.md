---
'@opentask/taskin-types': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-task-server-ws': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-task-provider-pinia': patch
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': minor
'taskin': minor
---

Grupos aninhados: um grupo pode estar dentro de outro, ate quatro niveis. O pai
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
