# 🧩 Task 101 — Levar uma task para o topo ou para o fim da lista visivel, num clique

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description
Na tela de priorizacao so existe mover uma posicao por vez: moveUp e moveDown. Levar uma task do meio para o topo e trabalho rotineiro e hoje custa um clique por posicao, ou um arrasto longo. Dois botoes por task resolvem. O topo e o fim sao os da lista visivel, ou seja, depois do filtro e dentro do modo de ordenacao atual, e nao os da lista inteira. Vale tambem para grupos, que ja tem variantes proprias de moveBefore e moveAfter.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `moveToTop(id)` e `moveToBottom(id)` no `usePrioritization`, relativos a lista **visivel**
- [ ] Variantes para grupo, `moveGroupToTop` e `moveGroupToBottom`, como ja existem para `moveBefore`/`moveAfter`
- [ ] Decidir e documentar o que "topo" significa para uma task dentro de um grupo
- [ ] Dois botoes por cartao, com alvo de toque decente e rotulo acessivel
- [ ] Reaproveitar a estrategia de numeracao que a task-084 trouxe: mover para o topo nao pode reescrever a lista inteira
- [ ] Entrar no historico de `undo`/`redo`, como as outras movimentacoes
- [ ] TDD no composable, com os casos de lista filtrada e de lista ordenada por dificuldade
- [ ] Verificar no dashboard aberto, com o cenario de 500 tasks, quantos arquivos cada botao altera

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
