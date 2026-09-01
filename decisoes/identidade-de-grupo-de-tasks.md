# Registro de Decisão Técnica — Identidade de grupo de tasks

Tipo semântico:

`registro_decisao_tecnica`

Status: **em aberto** — depende de levantamento sobre providers

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

## O que falta para decidir

O critério que trava a escolha é **como cada provider trata agrupamento**, porque
a resposta muda o custo da opção A:

- `file-system-task-provider` — hoje inline no `.md`, sem lugar natural para uma
  entidade
- `task-provider-pinia` — em memória, acompanha o que o domínio definir
- **Redmine** (task-002, WIP) — tem hierarquia/categoria nativa? Mapeia para
  grupo ou para `parent.type === 'task'`?
- **GitHub** (citado no changeset da task-031 como provider não-arquivo) — não
  tem grupo; teria milestone, label ou projeto. Nenhum é equivalente exato

Se a maioria dos providers já expõe grupo como entidade com id e nome próprios, A
é natural e barata. Se a maioria não tem o conceito, B ou C evitam inventar no
domínio algo que nenhuma fonte sabe representar.

## Relação com o canônico

- Aberta a partir da task-034, item 2 ("onipresença dos campos de grupo no
  modelo"), que fica bloqueada nesta decisão
- Item 3 da mesma task (semântica dos ids: uuid vs sequencial) é vizinho, mas
  independente
- `ParentRef` (`{ type: 'group'; id: GroupId } | { type: 'task'; id: TaskId }`)
  já está implementado no design-vue e não muda em nenhuma das opções — o que
  muda é onde o *nome* mora
