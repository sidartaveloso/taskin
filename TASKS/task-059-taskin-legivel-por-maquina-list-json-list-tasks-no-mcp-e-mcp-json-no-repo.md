# 🧩 Task 059 — Taskin legivel por maquina: list --json, list_tasks no MCP e .mcp.json no repo

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description

Nem o CLI nem o servidor MCP sabiam entregar a lista de tarefas de forma que
outra ferramenta consumisse. O `list` so imprimia tabela colorida; o servidor
MCP nao tinha ferramenta de listagem, e o recurso `taskin://tasks` **anunciava**
a capacidade e respondia com um espaco reservado:

```json
{"message": "Task list would be here", "note": "Requires ITaskProvider integration"}
```

Isso e pior que a ausencia: quem consome recebe algo com cara de dado.

Descoberto ao montar o `sandcastle`, que pede tres comandos do rastreador —
listar, ver, fechar. O taskin ja dava dois; o primeiro, nao.

## O que foi feito

### Uma selecao, nao tres

Havia **duas** implementacoes da mesma pergunta, e elas ja discordavam:

| onde | como casava o responsavel |
| --- | --- |
| comando `list` | substring em nome **ou** id |
| classe `Taskin` | `userId` exato — e projetava a task derrubando o `assignee` |

A saida em JSON e o MCP seriam a terceira e a quarta. `filterTasks` e
`summarizeTask` passaram a viver no pacote agnostico, e os tres caminhos fazem
a mesma pergunta ao mesmo lugar.

### `list --json`

Sai sem cabecalho, sem moldura e sem aviso de lista vazia — quem consome faz
`JSON.parse` na saida inteira, e uma linha de decoracao quebra isso. Lista
vazia devolve `[]`, nao uma mensagem.

Nao carrega `content` nem `description`: o provider de arquivos guarda o
markdown inteiro neles, e a listagem deste repositorio passaria de vinte mil
linhas. Quem lista quer **escolher** uma tarefa; o corpo se busca depois.

### `list_tasks` no MCP, e o recurso de verdade

Mesmos criterios do CLI, mesma seam. O `taskin://tasks` passou a devolver as
tarefas.

Para isso, `getAllTasks` entrou no `ITaskManager`, delegando ao provider — como
`lint` ja fazia. Era isso que a nota no codigo pedia: o servidor MCP so tinha o
manager, e listar era uma pergunta que ele nao sabia responder.

### `.mcp.json`

O agente que abrir este repositorio ganha as ferramentas sem configurar nada.

## Tasks

- [x] `filterTasks` e `summarizeTask` no pacote agnostico, com teste na seam
- [x] `list --json`, sem decoracao, sem o corpo do markdown
- [x] `list.ts` passa a usar a seam em vez da filtragem propria
- [x] `list_tasks` no MCP, com os mesmos criterios
- [x] `taskin://tasks` devolve tarefas em vez de espaco reservado
- [x] `getAllTasks` no `ITaskManager`
- [x] `.mcp.json` no repositorio
- [x] Changeset

## Notes

### Um defeito que so o transporte real revelou

Ao exercitar o servidor por stdio — JSON-RPC de verdade, nao chamada direta —
o SDK recusou a resposta:

```
MCP error -32602: Invalid tools/call result: expected string, received array
```

O involucro do transporte fazia `text: result.content`, embrulhando o arranjo
de blocos dentro de um bloco cujo `text` precisa ser string. Ou seja:
**`start_task` e `finish_task` nunca funcionaram pelo transporte real.**

Nenhum teste pegava porque todos chamam `callTool` direto e pulam o involucro —
a mesma forma do teste do dashboard, que mockava `http` e por isso deixou o
upgrade de express passar em branco. Entrou um teste afirmando a forma que o
SDK exige.

### O `ListTasksOptions` tipava status e type como `string`

Trocado pelos tipos do dominio. Um valor fora do conjunto nunca casaria, e
falhava em silencio: devolvia lista vazia como se nao houvesse tarefa.

### O que o `.mcp.json` nao resolve

Ele vale para quem abre **este** repositorio. Um agente rodando noutro projeto
que use taskin precisa apontar para o servidor por conta propria — o
`taskin init` nao escreve `.mcp.json`. Vale considerar.
