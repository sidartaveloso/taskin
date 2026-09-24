# Registro de Decisão Técnica — Identidade de grupo de tasks

Tipo semântico:

`registro_decisao_tecnica`

Status: **decidido — opção A**, e agora. O levantamento sobre providers foi feito e está abaixo

## A decisão

Grupo de tasks é uma **entidade** (`Group { id, name }`, com vida própria e
persistência única) ou continua sendo um **par de campos** repetido em cada task
(`groupId` + `groupName`)?

## Como está hoje

Não existe entidade. `groupId` e `groupName` são dois campos opcionais soltos no
`TaskSchema` (`packages/types-ts/src/taskin.schemas.ts:113`), e o provider de
arquivos grava as linhas `Group:` / `GroupName:` dentro de cada `.md`
(`file-system-task-provider.ts:221`). Uma busca por `interface Group`,
`GroupSchema` ou `class Group` em `packages/*/src` não retorna nada.

Consequências que já se manifestaram:

- **O nome fica duplicado por membro.** Um grupo com 4 tasks guarda o nome 4
  vezes. Nada garante coerência entre as cópias.
- **Renomear é escrita em N arquivos**, não uma. Sem transação, um erro no meio
  deixa o grupo com dois nomes.
- **O nome não sobrevive no design-vue.** A migração para `Task.parent: ParentRef`
  tirou `groupName` do `Task` da camada de design, e
  `use-prioritization.ts:89` passou a fixar `groupName: null` ao montar a árvore.
  `renameGroup` escreve no nó da árvore, que é recriado a cada rebuild — o nome
  se perde. O teste `PrioritizationPage.stories.ts > Group Drag Interactions`
  está vermelho por isso.

## Opções

### A. Entidade no domínio

`Group { id: GroupId; name: string | null }` em `@opentask/taskin-types`, com o
provider persistindo num lugar só. A task guarda apenas `groupId`.

- Resolve na raiz: sem duplicação, renomear é escrita única
- Custa schema, provider, formato de persistência e migração dos `.md` existentes
- Levanta a pergunta de onde o grupo mora no file-system provider — um
  `TASKS/groups.md`? frontmatter de um índice? diretório por grupo?

### B. Normalizar só na leitura

Domínio inalterado. O dashboard colapsa os pares `groupId`/`groupName` num
registro deduplicado ao ler, e reexpande ao gravar.

- Barato, destrava o teste, não quebra nada
- A duplicação e o risco de divergência continuam na origem
- Trata o sintoma

### C. Grupo é derivado, não armazenado

O agrupamento existe só como visão da árvore de priorização; o nome vive nas
preferências locais do cliente, não no domínio.

- Coerente com "grupo é ferramenta de priorização, não conceito de projeto"
- Perde o nome entre máquinas e entre usuários

## O levantamento que faltava, feito (14/09)

O critério declarado era: *"se a maioria dos providers já expõe grupo como
entidade com id e nome próprios, A é natural e barata"*. Foi consultada a
documentação primária de cada um.

| tracker | o conceito | id próprio | nome próprio | CRUD próprio | órfão ao apagar |
| --- | --- | --- | --- | --- | --- |
| **Redmine** | `issue_categories` | sim | sim | `POST/PUT/DELETE /issue_categories/:id` | `reassign_to_id` no DELETE |
| **GitHub** | milestones | `id` e `number` | `title` + `description` | cinco endpoints dedicados | não documentado |
| **Jira** | components | sim | sim | `DELETE /rest/api/3/component/{id}` | `moveIssuesTo` no DELETE |

Não é maioria: **são todos**. E dois dos três já resolveram o problema que a
opção A levanta — o que fazer com os membros quando o grupo é apagado — com um
parâmetro de reatribuição na própria chamada de exclusão. Não é preciso inventar
a resposta; basta copiá-la.

A ressalva do texto anterior — *"o GitHub não tem grupo; nenhum é equivalente
exato"* — superestimava a diferença. Um milestone **é** um balde nomeado de
issues com identidade própria. O encaixe é imperfeito nas bordas (milestone tem
data de entrega, grupo não), e não no miolo.

## Por que "agora", e não depois

**O teste vermelho deixou de existir.** O documento citava
`PrioritizationPage.stories.ts` quebrado por causa do `groupName: null`. A
task-072 restaurou `groupName` no `Task` da camada de design e passou a agrupar
por identidade: os **216 testes** do `design-vue` passam. Com isso a opção B
perde o argumento que a sustentava — não sobrou nada barato para destravar.

**O nome não está "não sendo usado" — está sendo destruído.** Nos únicos dados
reais em uso (4 tasks num repositório consumidor) há `Group:` e **nenhuma**
linha `GroupName:`. A causa é o caminho de escrita:
`file-system-task-provider.ts:327` chama `setInlineField(..., task.groupName ||
undefined, ...)`, e um valor falsy **remove a linha**. Quem lia isso como "ninguém
nomeia grupos" (eu, inclusive) lia errado: é a incoerência entre cópias se
manifestando, que é exatamente o que a entidade previne.

**O custo de migração nunca será menor.** Zero tasks com grupo no taskin, zero no
geohub, quatro num consumidor — e essas quatro já perderam o nome, então não há o
que preservar.

## O precedente interno, e ele é um aviso

O taskin já tem um registro separado: `.taskin/.taskin-users.json`. Mas a task
grava `Assignee: Sidarta Veloso` — o **nome de exibição**, não o id. Essa
desnormalização custou **52 avisos de lint** num repositório consumidor e um
comando de CLI inteiro (task-055) para limpar.

A lição é direta: o grupo mora num registro ao lado do de usuários, e a task
referencia **só o `groupId`**. É o oposto do que foi feito com o assignee, e pelo
motivo que o assignee já demonstrou na prática.

A task-111 corrigiu a escrita: o `createTask` passou a gravar o id, o
`taskin lint` acusa o nome de exibição e o `--fix` o reescreve.

## Relação com o canônico

- Aberta a partir da task-034, item 2 ("onipresença dos campos de grupo no
  modelo"), que fica bloqueada nesta decisão
- Item 3 da mesma task (semântica dos ids: uuid vs sequencial) é vizinho, mas
  independente
- `ParentRef` (`{ type: 'group'; id: GroupId } | { type: 'task'; id: TaskId }`)
  já está implementado no design-vue e não muda em nenhuma das opções — o que
  muda é onde o *nome* mora

## Tarefas de implementação que decorrem

| task | o que faz | depende de |
| --- | --- | --- |
| **079** | a entidade `Group` no domínio, `Task` só com `groupId`, e as operações no `ITaskProvider` | — |
| **080** | o provider de arquivos persiste o registro; a linha `GroupName` sai do markdown | 079 |
| **081** | criar, renomear e apagar grupo na CLI, no MCP e no dashboard | 079, 080 |

**Sem migração, decidido.** Levantados os 20 projetos com taskin nesta máquina:
só `nexo` tem grupo — 4 tasks, e nenhuma com `GroupName`. Não há nome a
preservar, e o dono do repositório refará o grupo. A linha `GroupName` sai do
formato sem caminho de compatibilidade.
