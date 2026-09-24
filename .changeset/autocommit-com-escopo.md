---
'@opentask/taskin-git-utils': minor
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

Os commits automáticos passam a levar só o que a mensagem diz.

O commit de status (`start`, `pause`, `finish`, `review` e o `start_task`/
`finish_task` do MCP) fazia `git add` do arquivo da task e depois `git commit`
sem caminho, e o `git commit` sem caminho grava o index inteiro: o que a pessoa
tinha deixado staged ia junto, sob uma mensagem de status. Agora o commit
recebe os caminhos, e o resto do index fica como estava. O squash do
`autoSync` tinha o mesmo defeito e a mesma correção.

O commit de trabalho (`pause`, e `finish` em autopilot) ganha
`GitService.commitWork`: antes do `git add -A`, ele olha cada mudança e recusa
quando alguma parece sensível — arquivo `.env`, chave privada, arquivo de
credenciais, ou linha adicionada com um token. Nada é staged; a CLI mostra o
arquivo, a linha e o motivo. O corpo do commit lista os arquivos.

O git passa a rodar sem shell nesses caminhos: um título de task com aspas ou
`$(...)` vai literal para a mensagem.
