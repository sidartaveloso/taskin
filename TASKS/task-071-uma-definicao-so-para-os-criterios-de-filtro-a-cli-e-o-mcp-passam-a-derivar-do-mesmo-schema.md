# 🧩 Task 071 — Uma definicao so para os criterios de filtro: a CLI e o MCP passam a derivar do mesmo schema

- Status: pending
- Type: refactor
- Priority: 245
- Assignee: Sidarta Veloso

## Description
Cada criterio de filtro existe em cinco lugares escritos a mao: o tipo, a flag da CLI, o mapeamento da CLI, o schema JSON do MCP e o mapeamento do MCP. Acrescentar um criterio exige lembrar dos cinco, e esquecer nao quebra nada — so faz uma superficie ficar para tras.

## Tasks
- [ ] Teste vermelho: acrescentar um criterio ficticio ao schema e provar que ele aparece na CLI e no MCP sem edicao manual
- [ ] Teste vermelho: um criterio sem superficie e **erro de compilacao**, nao aviso
- [ ] O schema unico dos criterios, em zod
- [ ] O schema JSON do `list_tasks` passa a ser derivado
- [ ] As opcoes do `taskin list` passam a ser derivadas
- [ ] Os dois mapeamentos para `TaskFilterCriteria` somem
- [ ] Documentar como se acrescenta um criterio novo — que deve virar uma linha
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` verdes

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
