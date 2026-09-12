---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-types': minor
'taskin': minor
---

O taskin passa a entregar a lista de tarefas de forma que outra ferramenta
consuma — `taskin list --json` e `list_tasks` no servidor MCP.

## O que havia

O `list` só imprimia tabela colorida. O servidor MCP não tinha ferramenta de
listagem, e o recurso `taskin://tasks` **anunciava** a capacidade e respondia
com um espaço reservado:

```json
{"message": "Task list would be here", "note": "Requires ITaskProvider integration"}
```

Pior que não oferecer: quem consome recebe algo com cara de dado.

## Uma seleção, não três

Havia duas implementações da mesma pergunta, já discordando — o comando `list`
casava o responsável por substring em nome ou id, e a classe `Taskin` casava
`userId` exato, além de projetar a task derrubando o `assignee`. A saída em
JSON e o MCP seriam a terceira e a quarta.

`filterTasks` e `summarizeTask` vivem no pacote agnóstico, e os três caminhos
perguntam ao mesmo lugar.

## Detalhes que importam para quem consome

`list --json` sai **sem cabeçalho, moldura ou aviso** — a saída inteira é JSON
válido, e lista vazia é `[]`. Não carrega `content` nem `description`: o
provider de arquivos guarda o markdown inteiro neles, e a listagem deste
repositório passaria de vinte mil linhas. O corpo se busca pelo id.

`getAllTasks` entrou no `ITaskManager`, delegando ao provider como `lint` já
fazia — era o que faltava para um consumidor que só tem o manager responder
"que trabalho existe?".

`ListTasksOptions.status` e `.type` passam a usar os tipos do domínio em vez de
`string`. Um valor fora do conjunto nunca casaria, e falhava em silêncio.

## Um defeito de transporte, corrigido junto

Exercitando o servidor por stdio, o SDK recusava a resposta com
`invalid_union: expected string, received array`. O invólucro fazia
`text: result.content`, embrulhando o arranjo de blocos dentro de um bloco cujo
`text` precisa ser string — então **`start_task` e `finish_task` nunca
funcionaram pelo transporte real**. Nenhum teste pegava porque todos chamavam
`callTool` direto, pulando o invólucro.
