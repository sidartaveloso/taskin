# 🧩 Task 118 — O quadro de priorizacao move pelas operacoes do dominio, sem numerar sozinho

- Status: pending
- Type: refactor
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1130

## Description
Desde a task-106 o dashboard grava por operacoes nomeadas, mas o usePrioritization ainda calcula os numeros por conta propria, e a regra de numeracao existe duas vezes: no composable e no posicionarPrioridade do dominio. O quadro passa a mandar move-before e move-after tendo como referencia a primeira ou a ultima task visivel, o que preserva o topo da lista filtrada, e o desfazer passa a reenviar os valores anteriores das tarefas que a operacao devolveu como alteradas.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Mover para cima, para baixo, topo e fim no quadro mandam `move-before`/`move-after` pelo fio, com a **primeira ou a ultima task visivel** como referencia — o topo continua sendo o da lista filtrada (task-101), e sem filtro coincide com o `move-to-top` do dominio
- [ ] O mesmo para grupos, com as operacoes da task-117
- [ ] Arrastar tambem passa pelas operacoes
- [ ] O desfazer e o refazer: antes de mandar, o quadro guarda os valores anteriores das tasks que a operacao devolve como alteradas; desfazer reenvia `set-priority` (e `assign-to-group`/`remove-from-group` quando for o caso) com esses valores. Grava so o que mudou
- [ ] Remover do `usePrioritization` a numeracao propria (`numerarMovidos` e afins): a regra passa a existir **uma vez**, no dominio
- [ ] Conferir que o custo nao piora: medir no dashboard aberto com o `.bench500` (configuracao `taskin-bench500` do `.claude/launch.json`) contando com `git status` no repositorio do bench, como a task-101 fez — topo 1 arquivo, grupo de 3 grava 3, desfazer devolve
- [ ] Os botoes continuam so no modo `manual`
- [ ] TDD no composable e no `App.vue` (a traducao `operacoesDaMudanca` da 106 deve encolher ou sumir)
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

Desde a 106 o dashboard grava por operacoes nomeadas, mas o `usePrioritization`
ainda **calcula os numeros** e so manda o resultado. A regra de numeracao existe
duas vezes: no composable e no `posicionarPrioridade` do dominio. E o defeito que
mais apareceu neste repositorio — uma copia mantida a mao que diverge em
silencio.

### As duas decisoes que a 114 deixou, resolvidas

1. **Topo visivel ou topo da fila.** O quadro manda a referencia: primeira ou
   ultima task visivel. Nao precisa de operacao nova, e com filtro o topo
   continua sendo o que a pessoa esta vendo.
2. **O desfazer.** Toda operacao devolve as tasks alteradas; o quadro guarda o
   valor anterior delas antes de mandar e, para desfazer, reenvia esses valores.
   E exato e grava so o que mudou.

### Ordem

Depois da 117.
