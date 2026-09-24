# Registro de Decisão Técnica — Grupos aninhados

Tipo semântico:

`registro_decisao_tecnica`

Status: **decidido e implementado** (task-119)

## A decisão

Um grupo pode estar dentro de outro? O dashboard já oferecia os dois gestos —
soltar uma task sobre outra do **mesmo** grupo cria um subgrupo; soltar um grupo
sobre outro cria um pai com os dois dentro —, mas o domínio não sabia guardar
isso. O `Group` tinha só `id` e `name`, e a task guarda um grupo só. O
aninhamento vivia na árvore da tela e se desfazia quando a lista voltava do
servidor ou a página recarregava.

A task-118 expôs o defeito: desde que o quadro move pelo domínio, a lista volta
a cada movimento, e o passo 5 da story `Drag And Drop Interactions` passou a
falhar com dois grupos soltos no lugar do subgrupo.

Entre tirar o gesto do dashboard e implementá-lo de verdade, a escolha do
usuário foi implementar.

## Onde mora o pai

**No grupo**, como `parentId` opcional em `GroupSchema`
(`packages/types-ts/src/taskin.schemas.ts`). No provider de arquivos ele fica no
próprio `.taskin-groups.json`, ao lado do nome:

```json
{ "groups": { "g-sub": { "id": "g-sub", "name": "Sub", "parentId": "g-pai" } } }
```

A alternativa — a task guardar a cadeia inteira (`Group: g-pai/g-sub`) — repetia
o erro que a task-079 corrigiu com o nome: a mesma informação copiada em cada
membro, e mover um subgrupo reescrevendo N arquivos. Com o pai no grupo, aninhar
e desaninhar são **uma escrita**, e nenhuma task é tocada.

## O que "a task está no grupo" passa a significar

A task continua guardando **um** grupo, o mais interno (`Group: g-sub`). Estar
num grupo passa a querer dizer estar nele **ou num subgrupo dele**:

- **membro direto** de G: `task.groupId === G`;
- **na subárvore** de G: o grupo da task é G ou um descendente de G.

As regras que falam de "o grupo inteiro" usam a subárvore: mover um grupo move
os membros diretos e os dos subgrupos (`posicionarGrupo`, `moveGroup*`), e o
topo/fim de uma task agrupada é o da subárvore do seu grupo
(`posicionarNoExtremo`). As que falam de pertencer usam o membro direto:
`assignToGroup` põe a task **naquele** grupo, e o `hidden` da listagem conta os
membros diretos que o filtro escondeu.

## Onde o grupo aparece na fila

No lugar do **primeiro membro da subárvore inteira** — a mesma regra de antes,
estendida. Um pai sem membro direto aparece mesmo assim, onde o primeiro membro
de um subgrupo está, porque é ele que contém o subgrupo. `agruparTarefas`
(domínio) e `buildPriorityTree` (quadro) montam a árvore assim.

Mover um grupo **não muda o pai dele**: só os números dos membros. "Topo" e
"fim" de um subgrupo são os do pai, como para uma task agrupada; "depois do
grupo B" é antes do nó que vem depois de B na lista em que B está. Uma task
como alvo precisa ocupar a própria linha na lista do grupo movido; senão a
recusa aponta o grupo que ocupa a linha dela.

## Profundidade máxima

**Quatro níveis**, contando o grupo da raiz como o primeiro
(`PROFUNDIDADE_MAXIMA_DE_GRUPO`, em `packages/task-manager/src/aninhar-grupos/`).

Quatro dão épico, funcionalidade, história e fatia — mais do que o Jira (épico e
tarefa) e o GitHub (milestone, sem aninhamento) oferecem — e ainda cabem
indentados numa linha de terminal e no quadro. O teto existe para a árvore se
ler: sem ele, soltar grupo sobre grupo no quadro empilharia níveis sem ninguém
ter decidido. A conta inclui a subárvore que vai junto: aninhar um grupo que já
tem filhos é recusado se os filhos passariam do teto.

## Recusas

No domínio (`validarAninhamento`), antes de gravar, e de novo no registro:

| caso | mensagem |
| --- | --- |
| pai inexistente | `Group 'g-x' does not exist.` |
| o grupo dentro de si mesmo | `cannot be placed inside itself` |
| ciclo (A dentro de B dentro de A) | `... would make a cycle` |
| acima do teto | `Groups nest at most 4 levels deep` |

O arquivo não recusa nada — ele se edita à mão e passa por merge. Por isso o
`taskin lint` acusa, no `.taskin-groups.json`, pai inexistente e ciclo como
**erro** (a árvore não se monta) e profundidade acima do teto como **aviso** (a
árvore se monta, só fica funda demais). A listagem e o quadro não travam num
ciclo gravado: o grupo fica na raiz.

## Apagar um grupo que tem subgrupos

Os subgrupos **sobem para o pai do apagado** — ou para a raiz, quando ele era da
raiz. É a mesma regra que o `reassignTo` já aplicava às tasks: ninguém fica
apontando para o vazio. As tasks seguem como antes (ficam sem grupo, ou vão para
`reassignTo`).

## Capacidade própria

Grupos já eram capacidade opcional do provider (task-079). Aninhamento é **outra**
capacidade, dentro do registro de grupos: `IGroupRegistry.setParent?` é
opcional. Um provider pode ter grupos e não ter grupo dentro de grupo — a
milestone do GitHub não tem. Sem `setParent`:

- `createGroup` com `parentId`, `nestGroup` e `unnestGroup` recusam com
  `NESTING_NOT_SUPPORTED`, uma frase só para as três superfícies;
- o MCP não anuncia `nest_group` nem `unnest_group`.

O registro que implementa `setParent` prova `runGroupNestingContractTests`,
separado de `runGroupRegistryContractTests` para um registro sem a capacidade
continuar cumprindo aquele.

## As operações e as superfícies

Três operações nomeadas no `ITaskManager`, no portão de
[`superficies-derivam-do-mesmo-contrato.md`](superficies-derivam-do-mesmo-contrato.md):

| operação | CLI | MCP | WebSocket |
| --- | --- | --- | --- |
| `createGroup(name, { id?, parentId? })` | `group create <nome> --parent <grupo>` (`add` segue como apelido) | `create_group` | `create-group` |
| `nestGroup(groupId, parentId)` | `group nest <grupo> <pai>` | `nest_group` | `nest-group` |
| `unnestGroup(groupId)` | `group unnest <grupo>` | `unnest_group` | `unnest-group` |

`createGroup` entrou no contrato junto: até aqui era uma consulta do servidor
WebSocket e um `group add` que chamava o registro direto, os dois fora do
portão.

`taskin list --json` leva a árvore sem achatar — cada grupo com `tasks` (os
membros diretos) e `groups` (os subgrupos, na mesma forma) —, porque a saída
serve qualquer ferramenta e achatar perde a informação. O texto indenta os
subgrupos; `taskin group list` mostra a hierarquia; `list_groups` do MCP traz o
`parentId`.

## O quadro

O dashboard recebe os grupos com o pai (`/api/groups`) e monta a árvore a partir
deles (`buildPriorityTree(tasks, collapsed, grupos)`). Os dois gestos viram
operações:

- **subgrupo**: `create-group` com `parentId`, e `assign-to-group` dos dois
  membros;
- **grupo sobre grupo**: `create-group` do pai novo, e `nest-group` de cada um.

O `usePrioritization` expõe `changedGroups` ao lado de `changedTasks`, e a página
emite `update-group` **antes** de `update-task`: o grupo precisa existir antes de
alguém entrar nele. Desfazer e refazer guardam o pai de cada grupo junto dos
valores das tasks, como os outros movimentos da task-118 — desfazer um
aninhamento sai como `unnest-group`.
