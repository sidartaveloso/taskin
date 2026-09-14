# 🧩 Task 082 — Mover uma tarefa na priorizacao reescreve todos os arquivos: numerar entre vizinhos em vez de renumerar tudo

- Status: in-progress
- Type: fix
- Priority: 260
- Assignee: Sidarta Veloso

## Description
O commit() da priorizacao reatribui order = posicao x 10 para toda a arvore, e cada tarefa cujo numero mudou e gravada no seu .md. Com 40 das 82 tarefas sem Priority, o primeiro movimento reescreve todas elas.

## Tasks
- [ ] Teste vermelho: mover uma tarefa muda o `order` de **uma** tarefa, e nao de todas
- [ ] Teste vermelho: mover da ultima posicao para a primeira tambem muda uma so
- [ ] Teste vermelho: quando nao ha espaco entre os vizinhos, a renumeracao acontece e e local
- [ ] Numerar entre vizinhos no lugar do `commit()` denso
- [ ] Decidir o que fazer com as tarefas sem `order` — nao dar numero a todas de uma vez
- [ ] `pnpm lint`, `typecheck`, `test` e `build` verdes

## Notes

**Relatado de uso real:** abrir o dashboard, ir para a tela de priorizacao e
clicar na seta para cima da segunda tarefa. Todos os arquivos de tarefa sao
alterados.

**A cadeia, confirmada no codigo:**

1. `commit()` (`use-prioritization.ts:216`) percorre a arvore inteira e faz
   `node.task.order = counter * orderStep` para **cada** tarefa.
2. `changedTasks` (`:231`) devolve toda tarefa cujo instantaneo difere da linha
   de base.
3. `PrioritizationPage.vue:99` observa essa lista e emite cada uma; o dashboard
   grava cada `.md`.

**Por que da em "todos":** 42 das 82 tarefas deste repositorio tem `Priority`;
**40 nao tem nenhum**. No primeiro movimento essas 40 ganham numero pela primeira
vez, diferem da linha de base, e sao todas gravadas.

E o custo nao some depois: com todas numeradas, mover da posicao 40 para a 1
renumera as 40 do caminho. So a troca entre vizinhos e barata.

**Por que isso importa aqui mais do que num app comum.** As tarefas sao
**arquivos versionados**. Um clique de seta vira dezenas de arquivos no
`git status`, e com `automation.level: autopilot` vira um commit gigante. O
historico do repositorio passa a registrar a navegacao na tela em vez da decisao
tomada — e revisar um diff desses e impossivel.

**O conserto: numerar entre vizinhos.** A tarefa movida recebe um numero entre o
anterior e o proximo (o ponto medio, ou o equivalente fracionario). Um movimento
altera **um** arquivo, independente da distancia percorrida. E a mesma ideia de
indexacao fracionaria que listas ordenadas colaborativas usam.

Duas coisas a resolver junto, e elas sao metade da task:

**Quando o espaco acaba.** Com passo 10, cabem poucos movimentos entre dois
vizinhos antes de os inteiros se esgotarem. As saidas usuais sao passo inicial
maior, numeros fracionarios, ou renumerar **a vizinhanca** quando faltar espaco —
nunca a lista toda. Escolher e declarar.

**As tarefas sem `order`.** Dar numero a todas de uma vez e exatamente o que
causa o problema relatado. A alternativa e tratar ausencia como "vai para o fim,
na ordem em que aparece" ate que alguem a mova de proposito — e so entao ela
ganha um numero. Isso preserva a propriedade de que so o que foi mexido e
gravado.

**O teste que vale** conta **quantas** tarefas mudaram, e nao se a ordem final
esta certa. Um teste que so verifica a ordem passaria com a implementacao atual,
que esta correta na ordem e errada no custo.
