# 🧩 Task 071 — Uma definicao so para os criterios de filtro: a CLI e o MCP passam a derivar do mesmo schema

- Status: done
- Type: refactor
- Priority: 245
- Assignee: Sidarta Veloso

## Description
Cada criterio de filtro existe em cinco lugares escritos a mao: o tipo, a flag da CLI, o mapeamento da CLI, o schema JSON do MCP e o mapeamento do MCP. Acrescentar um criterio exige lembrar dos cinco, e esquecer nao quebra nada — so faz uma superficie ficar para tras.

## Tasks
- [x] Teste vermelho: acrescentar um criterio ficticio ao schema e provar que ele aparece na CLI e no MCP sem edicao manual — `filter-criteria.test.ts` › "um criterio novo aparece no schema JSON do MCP…" e "…nas opcoes da CLI…": passam `FilterCriteriaSchema.extend({ fictional })` pelos geradores e provam que `fictional` emerge nas duas superficies.
- [x] Teste vermelho: um criterio sem superficie e **erro de compilacao**, nao aviso — `filter-criteria.test.ts:20` tem um `@ts-expect-error` sobre `Record<keyof TaskFilterCriteria, CriterionSurface>` faltando `text`; se a omissao passar a compilar, `pnpm typecheck` falha (verificado: sem o gate, TS2578 acusa).
- [x] O schema unico dos criterios, em zod — `packages/task-manager/src/filter-tasks/filter-criteria.ts` › `FilterCriteriaSchema`; `TaskFilterCriteria` agora e `z.infer` dele.
- [x] O schema JSON do `list_tasks` passa a ser derivado — `filterCriteriaJsonSchema()` (via `z.toJSONSchema`) alimenta `inputSchema` em `task-server-mcp.ts:listTools`.
- [x] As opcoes do `taskin list` passam a ser derivadas — `filterCriteriaCliOptions()` em `cli/src/commands/list.ts`; `taskin list --help` mostra `-u, --assignee`, `-s, --status`, etc.
- [x] Os dois mapeamentos para `TaskFilterCriteria` somem — o literal em `list.ts` e o `criterioDe` do MCP sumiram; ambos usam `parseFilterCriteria` (o `parse` do schema). De quebra, corrige o sintoma `--user` vs `assignee`: a flag agora e `--assignee`, casada com a chave.
- [x] Documentar como se acrescenta um criterio novo — que deve virar uma linha — docstring de `filter-criteria.ts` ("Como acrescentar um criterio novo": propriedade `.optional()` + entrada em `FILTER_CRITERIA_SURFACES`, e o passo 2 e cobrado pelo compilador). README do CLI passa a listar `--assignee` e o `[filter]` posicional.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` verdes — nos tres pacotes tocados (task-manager 40 testes, task-server-mcp 19, cli 363) lint/typecheck/test verdes; `pnpm build` do monorepo verde (22/22). Os unicos testes vermelhos no `pnpm test` do monorepo sao os de navegador (`@vitest/browser-playwright` em design-vue e ui-sense), que nao rodam neste ambiente e nao importam este codigo.

## Notes

**TDD.** O teste que vale nao afirma a forma do schema — afirma a **propriedade**:
um criterio acrescentado num lugar so aparece nas duas superficies. Escrito
primeiro, ele falha hoje.

## Cinco lugares para cada criterio, contados

| # | onde | o que |
| --- | --- | --- |
| 1 | `filter-tasks.types.ts:13-26` | `TaskFilterCriteria` — o tipo |
| 2 | `list.ts:19-39` | a declaracao da flag no commander |
| 3 | `list.ts:82-87` | o mapeamento `options` → `criteria` |
| 4 | `task-server-mcp.ts:199-205` | as `properties` do schema JSON |
| 5 | `criterioDe`, em `task-server-mcp.ts` | o mapeamento `args` → `criteria` |

Seis, contando o vocabulario de `?filter=` do dashboard em `App.vue`.

**O sintoma ja apareceu, e ninguem percebeu:** o critério chama-se `assignee`, e
a flag da CLI chama-se `--user`. Duas grafias para a mesma coisa, cada uma numa
lista mantida a mao. Ninguem decidiu isso — foi divergindo.

E acrescentar um criterio hoje exige lembrar dos cinco. **Esquecer nao quebra
nada**: nenhum teste falha, nada acusa. A superficie esquecida so passa a oferecer
menos que a outra, em silencio, ate alguem precisar.

## A ideia

Uma definicao so, em zod, de que criterios existem e de que forma cada um tem. As
superficies **derivam** dela:

- **O schema JSON do MCP** sai de `z.toJSONSchema()`. Isto nao e aposta: o
  `packages/types-ts` **ja faz exatamente isso** desde a migracao para o zod 4
  (`generate-schemas.ts:58`). E o mesmo mecanismo, aplicado a outro schema.
- **As opcoes do commander** saem de um gerador pequeno que le o schema — nome
  longo, se leva valor, e a descricao.
- **A validacao e a conversao** para `TaskFilterCriteria` saem do `parse` do
  proprio schema, e os dois mapeamentos a mao desaparecem.

## O que torna isto um portao, e nao so uma conveniencia

Derivar sozinho ainda deixa alguem esquecer de ligar uma superficie nova. O que
fecha o circuito e o tipo **recusar** a omissao:

```ts
// esboco: um criterio sem superficie nao compila
const SUPERFICIES = {
  status: ..., type: ..., assignee: ..., open: ..., closed: ..., text: ...,
} satisfies Record<keyof TaskFilterCriteria, DescritorDeCriterio>;
```

Com isso, acrescentar `active` ou `sort` ao tipo e **nao** ligar a superficie
vira erro de compilacao — que e o unico tipo de lembrete que nao depende de
ninguem lembrar.

Esse e o ponto da task. A economia de digitacao e o efeito colateral; o efeito
principal e transformar um esquecimento silencioso num erro barulhento.

## O que nao entra, de proposito

- **`--json`** nao e criterio, e formato de saida. Fica como flag escrita a mao.
- **O dashboard** le `?filter=` de uma URL, e o vocabulario dele nao precisa ser
  gerado no mesmo movimento. Avaliar se vale, e declarar a decisao — mas nao
  travar esta task nisso.
- **Nao inventar um mini-framework.** Se o gerador de opcoes passar de umas
  poucas dezenas de linhas, provavelmente o desenho errou. O objetivo e uma
  costura, nao uma camada.

## Relacionado

A task-070 (ordenacao) e a **primeira cliente** disto: `sort` e justamente um
criterio novo que hoje precisaria ser escrito nos cinco lugares. Se esta task vier
antes, aquela encolhe; se vier depois, ela e a prova de que o mecanismo funciona.

A ordem entre as duas e decisao de quem pegar — mas fazer a 070 a mao e depois
generalizar tambem e legitimo, e ate mais honesto, porque generalizar a partir de
dois casos reais erra menos que generalizar a partir de um.

## Decisao registrada — o dashboard fica de fora, por ora

O `?filter=` do dashboard **nao** passa a derivar do schema nesta task. O
vocabulario dele e um so criterio (`text`/busca livre) lido de uma URL, sem as
outras superficies; ligar `App.vue` ao pacote agnostico so para isso pagaria mais
costura do que economiza. As tres superficies que compartilhavam a duplicacao
real — o tipo, a CLI e o MCP — ja derivam do schema unico. Quando o dashboard
crescer para expor mais criterios, `filterCriteriaJsonSchema`/
`FILTER_CRITERIA_SURFACES` ja estao prontos para ele consumir.
