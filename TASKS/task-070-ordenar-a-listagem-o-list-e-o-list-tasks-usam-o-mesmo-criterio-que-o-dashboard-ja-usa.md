# 🧩 Task 070 — Ordenar a listagem: o list e o list_tasks usam o mesmo criterio que o dashboard ja usa

- Status: in-progress
- Type: feat
- Priority: 880
- Assignee: Sidarta Veloso

## Description
O taskin list devolve as tarefas na ordem em que o provider as encontra — por id — e nao oferece nenhuma forma de ordenar. O dashboard ja tem os modos manual, diff-asc e diff-desc, mas a logica mora num pacote Vue que o CLI nao alcanca.

## Tasks
- [ ] Teste vermelho: a ordenacao, como funcao pura, com os tres modos e o caso de `order` ausente
- [ ] Extrair a ordenacao do pacote Vue para `task-manager`, sem mudar o comportamento do dashboard
- [ ] O dashboard passa a consumir a funcao extraida — os testes dele continuam verdes
- [ ] `taskin list --sort <modo>`
- [ ] O `--json` emite os grupos, com a contagem do que o filtro deixou de fora
- [ ] `sort` no schema do `list_tasks` do MCP
- [ ] Documentar nos READMEs e no site (os dois idiomas)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` verdes

## Notes

**TDD, e a costura vem antes do teste.** A funcao de ordenacao pura e o ponto de
observacao: e ali que os tres modos se afirmam, antes de qualquer flag existir.
Vermelho primeiro. Fechar com `pnpm test` verde no monorepo inteiro, e nao so no
pacote tocado.

## O que existe hoje, levantado antes de escrever esta task

| superficie | ordena? | como |
| --- | --- | --- |
| dashboard, aba de priorizacao | **sim** | `use-prioritization.ts`, modos `manual`, `diff-asc`, `diff-desc` |
| `taskin list` | nao | devolve na ordem em que o provider acha, que na pratica e por id |
| `list_tasks` (MCP) | nao | nenhuma ocorrencia de `sort` no servidor |

A ordem atual do `list` e enganosa justamente por parecer intencional:

```
002  prio=110
011  prio=20
016  prio=30
022  prio=40
```

Esta ordenado por **id**, e a coluna de prioridade desce e sobe sem padrao. Quem
le a saida — pessoa ou agente — precisa reordenar de cabeca para saber o que vem
primeiro. Foi exatamente esse o custo que apareceu quando um agente autonomo
escolheu uma tarefa de prioridade 30 tendo uma de 255 na mesma lista.

## O ponto de desenho, e ele nao e a flag

A logica de ordenacao **ja existe** e mora em
`packages/design-vue/src/composables/use-prioritization/use-prioritization.ts` —
um pacote **Vue**. O CLI nao pode depender dele, e o servidor MCP muito menos.

Entao a saida errada e obvia: reescrever o mesmo `sort` no CLI. Isso daria duas
implementacoes da mesma regra, que divergem no dia em que uma mudar — a forma de
defeito que mais aparece neste repositorio.

A saida certa e **extrair** a ordenacao para onde as tres superficies alcancam.
`packages/task-manager/src/filter-tasks/` e o candidato natural: e onde
`filterTasks` e `summarizeTask` ja vivem, e foi criado exatamente para acabar com
tres implementacoes diferentes de filtro. Ordenar e o irmao que faltou.

O dashboard passa a consumir a funcao extraida. Os testes dele
(`use-prioritization.test.ts`, com capturas de tela) sao a rede de seguranca:
se o comportamento visivel mudar, eles acusam.

## O que a ordenacao faz hoje, para nao se perder na mudanca

- **`manual`** — ordena por `order` (que a listagem expoe como `priority`), com
  `undefined` por ultimo e estabilidade no resto. Depois **agrupa** tarefas
  consecutivas que compartilham o mesmo grupo num unico no.
- **`diff-asc` / `diff-desc`** — ordena por `difficulty`.

Duas decisoes a tomar, e vale decidi-las antes de escrever o teste:

**O agrupamento acompanha?** No dashboard ele existe para desenhar caixas. Numa
saida de terminal e num JSON de agente, agrupar pode ajudar ou so atrapalhar. Se
nao acompanhar, a funcao extraida precisa separar "ordenar" de "agrupar" — o que
provavelmente e uma melhoria por si so.

**O `--json` leva os grupos, decidido.** A primeira versao desta nota dizia o
contrario — emitir tarefas planas e deixar quem consome agrupar — com o argumento
de que "um agente nao precisa de arvore". O argumento estava errado, e o motivo
importa: `--json` nao e a interface do agente, e a interface de maquina do
produto, e a plateia dela e aberta — script de alguem, painel de terceiro, passo
de CI.

Emitir plano empurraria a regra de agrupamento para **cada** consumidor
reimplementar, o que e a mesma duplicacao mantida a mao que a task-071 combate.
Quem quiser plano achata em uma linha; quem recebe plano nao consegue reagrupar
sem copiar a regra.

Entao a saida carrega a **mesma estrutura semantica** que o dashboard monta, pela
**mesma funcao** — grupo com id, nome, os membros que casam com o filtro, e a
contagem do que ficou de fora. O que nao vai junto e decoracao de apresentacao:
estado de recolhido, cor, largura. Essas sao do dashboard.

**Grupo parcial: decidido.** Quando o filtro deixa so parte de um grupo, mostrar
os membros que casam, agrupados por identidade, com a contagem do que ficou de
fora ("3 de 7"). Isso e honesto com quem le e nao quebra a promessa do filtro.

Descartado de proposito: trazer o grupo inteiro quando qualquer membro casa. Seria
util quando o grupo e a unidade de trabalho, mas faz `--open` devolver tarefas
fechadas — um filtro que se alarga sozinho e pior que um filtro que esconde.

Isso depende da **task-072**, que conserta o agrupamento por adjacencia: sem
agrupar por identidade, um grupo parcial nem se reconhece como um grupo so.

**Os nomes dos modos servem para um CLI?** `diff-asc` nasceu de um seletor de
interface. Num terminal, `--sort difficulty --desc` talvez leia melhor. Mas o
pedido foi **o mesmo padrao do dashboard**, e vocabulario unico entre superficies
vale mais que elegancia local. Se divergirem, que seja por decisao declarada, e
que a documentacao diga que sao a mesma coisa.

## Detalhe que morde

`summarizeTask` renomeia `task.order` para `priority` na saida do `list`. A
funcao de ordenacao vai trabalhar com `order`, e a saida mostra `priority`. Ou se
unifica o nome, ou se documenta a traducao — deixar implicito e como o proximo
leitor perde meia hora.
