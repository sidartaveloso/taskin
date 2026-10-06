# 🧩 Task 101 — Levar uma task para o topo ou para o fim da lista visivel, num clique

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 1300
- Group: g-n1xf2yf7
- Difficulty: 3

## Description
Na tela de priorizacao so existe mover uma posicao por vez: moveUp e moveDown. Levar uma task do meio para o topo e trabalho rotineiro e hoje custa um clique por posicao, ou um arrasto longo. Dois botoes por task resolvem. O topo e o fim sao os da lista visivel, ou seja, depois do filtro e dentro do modo de ordenacao atual, e nao os da lista inteira. Vale tambem para grupos, que ja tem variantes proprias de moveBefore e moveAfter.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `moveToTop(id)` e `moveToBottom(id)` no `usePrioritization`, relativos a lista **visivel** — `moverParaExtremo` em `use-prioritization.ts` busca o alvo em `tree` (ja filtrado), nao em `treeInternal`. Prova: `packages/design-vue/src/composables/use-prioritization/use-prioritization.test.ts` › `moveToTop / moveToBottom` › `com filtro, o topo e o da lista visivel…` e `com filtro, o fim e o da lista visivel`
- [x] Variantes para grupo, `moveGroupToTop` e `moveGroupToBottom` — mesmo `moverParaExtremo`, com `kind: 'group'`. Prova: `grupo sobe para o topo e desce para o fim da lista de fora`, `grupo respeita o filtro…`
- [x] Decidir e documentar o que "topo" significa para uma task dentro de um grupo — **topo do proprio grupo** (o contêiner irmao visivel); o grupo tem os proprios botoes para a lista de fora; grupo aninhado vai ao topo do grupo que o contem. Documentado no JSDoc de `moverParaExtremo` e em `use-prioritization.types.ts`. Prova: `tarefa dentro de grupo vai para o topo do proprio grupo, e nao da lista`
- [x] Dois botoes por cartao, com alvo de toque decente e rotulo acessivel — ⤒/⤓ em `PriorityGroupRenderer.vue` (cartao e cabecalho do grupo), `aria-label` "Move to top"/"Move to bottom", classe `.move-btn--edge` com 24×24px (WCAG 2.5.8) em `PrioritizationScreen.vue`; so aparecem com `dragEnabled` (modo `manual`). Prova: `components/templates/PrioritizationScreen.spec.ts` (3 testes) e `PrioritizationPage.spec.ts` › `forwards screen commands to the composable`
- [x] Reaproveitar a estrategia de numeracao que a task-084 trouxe — `numerarMovido` virou `numerarMovidos(itens, ids)`: aceita um bloco contiguo (a tarefa, ou os membros do grupo) e reparte valores entre os vizinhos; `commit(...movidos)`. Topo custa 1 arquivo (grupo: so os membros). Excecao medida, ver notas: fim de uma cauda sem `order`
- [x] Entrar no historico de `undo`/`redo` — `pushHistory(preSnapshot)` antes de mutar; no-op (ja no extremo, ou fora do modo manual) nao gera historico. Prova: `entra no historico de undo/redo`, `quem ja esta no topo ou no fim nao gera historico nem mudanca`
- [x] TDD no composable, com os casos de lista filtrada e de lista ordenada por dificuldade — 15 testes em `packages/design-vue/src/composables/use-prioritization/use-prioritization.test.ts` › `moveToTop / moveToBottom` (escritos antes, 13 vermelhos por `is not a function`); ordenado por dificuldade: `fora do modo manual nao faz nada…`. Rodar: `cd packages/design-vue && npx vitest run --browser.enabled=false --environment jsdom src/composables/use-prioritization`
- [x] Verificar no dashboard aberto, com o cenario de 500 tasks, quantos arquivos cada botao altera — feito fora do sandbox, no dashboard do `.bench500` (500 tarefas, todas numeradas, grupo de 3), contando com `git status` no repositorio do bench depois de cada clique: topo de uma tarefa do meio **1** arquivo, fim da mesma tarefa **1**, grupo ao fim **3** (so os membros), e o Desfazer devolveu os 3. No composable, o cenario da 082 (20 numeradas) esta em `custo no cenario de 500 tarefas` e na tabela das notas

## Notes

### O que existe hoje

O `usePrioritization` tem `moveUp(id)` e `moveDown(id)`, que andam **uma
posicao**. Para levar uma task do meio de uma lista de trinta ate o topo, sao
trinta cliques ou um arrasto atravessando a tela inteira. Existem tambem
`moveBefore`/`moveAfter` e suas variantes de grupo, mas elas pedem um alvo — nao
servem para "o topo", que nao e uma task especifica.

### A parte que exige decisao

**"Topo" e o da lista visivel.** O `tree` que a tela renderiza ja passou pelo
modo de ordenacao e pelo filtro de texto. Levar ao topo tem que significar
*antes da primeira linha que a pessoa esta vendo* — se significasse o topo da
lista inteira, a task sumiria de vista ao ser movida, que e o oposto do pedido.

**Task dentro de grupo.** Um grupo e uma linha da lista, e as tasks dele sao
linhas dentro dele. O topo de uma task agrupada pode ser o topo do grupo ou o
topo geral — sao duas operacoes diferentes e uteis. A escolha precisa ficar
escrita, e a menos surpreendente parece ser **o topo do proprio grupo**, com o
grupo inteiro tendo seus proprios botoes para subir na lista de fora.

**Ordenacao que nao e manual.** Nos modos `diff-asc` e `diff-desc` a ordem
exibida nao e a das prioridades. Mover ao topo ali ou reordena a prioridade
(e a lista salta, porque a exibicao nao segue a prioridade) ou nao faz sentido.
Provavelmente os botoes so devem existir no modo `manual` — decisao a declarar,
nao a omitir.

### O custo, que ja mordeu antes

A task-082 mediu o estrago: numa lista onde so algumas tasks tem prioridade,
mover uma para cima reescrevia **499 arquivos** num projeto de 500. A task-084
resolveu numerando so o prefixo necessario, e a 082 derrubou o custo para **1**.
Mover para o topo e exatamente o movimento de maior alcance que existe, entao e
o que mais expoe essa logica: precisa usar a mesma estrategia e ser medido no
cenario de 500 tasks antes de fechar.

### Por que dois botoes, e nao um menu

O pedido foi explicito: e atividade rotineira e nao pode custar muitos cliques.
Um menu de contexto acrescenta um clique a cada uso e esconde a acao de quem
nao sabe que ela existe.

### Decisoes e medicao (task-101, RALPH)

**Modos `diff-asc`/`diff-desc`:** os botoes nao aparecem (seguem `dragEnabled`,
como as setas) e as quatro funcoes sao no-op fora do modo `manual` — a exibicao
ali nao segue a prioridade, entao mover nao levaria a linha a lugar visivel.

**Custo medido no composable** (500 tarefas, as 20 primeiras com `order`, grupo
de 2 no meio; `changedTasks` e o que o dashboard grava):

| botao | arquivos |
| --- | --- |
| topo, tarefa numerada | **1** |
| topo, tarefa sem numero (posicao 400) | **1** |
| topo, grupo de 2 | **2** (so os membros) |
| fim, com a lista toda numerada | **1** |
| fim, com a cauda **sem** numero | **481** |

**A ponta que ficou, para decisao humana:** levar ao fim quando a cauda visivel
nao tem `order` numera a cauda inteira. Nao e defeito do `commit`: tarefa sem
`order` sempre ordena por ultimo, entao "depois da ultima" so se expressa dando
numero a quem esta atras — o mesmo custo de prefixo que a task-082 registrou
(124 no meio da regiao sem numero), aqui no maximo. E pago uma vez. Saidas
possiveis, nenhuma tomada aqui: (a) no fim de cauda sem numero, *tirar* o
`order` da movida (1 arquivo, mas ela cai na posicao natural da cauda, nao na
ultima linha); (b) mudar como tarefa sem `order` se ordena, no dominio.
Coberto por `levar uma tarefa ao fim de uma cauda sem numero numera a cauda`,
que fixa o numero 481 para que qualquer mudanca nisso seja deliberada.

