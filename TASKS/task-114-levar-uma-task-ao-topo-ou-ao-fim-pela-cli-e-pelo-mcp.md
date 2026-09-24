# 🧩 Task 114 — Levar uma task ao topo ou ao fim pela CLI e pelo MCP

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1030

## Description
O dashboard ganhou os botoes de topo e fim na task-101, mas a CLI e o MCP so tem numero absoluto e --before/--after, que pedem um alvo. Levar uma task ao topo ou ao fim e a operacao mais rotineira de priorizacao e precisa de atalho nas tres superficies: moveToTop e moveToBottom como operacoes nomeadas do ITaskManager, --top/--bottom no taskin priority, e o mesmo no set_priority do MCP. O dashboard passa a usar as mesmas operacoes.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `moveToTop(taskId)` e `moveToBottom(taskId)` como operacoes nomeadas do `ITaskManager`, ao lado de `moveBefore`/`moveAfter`
- [ ] Mesma semantica do dashboard (task-101): uma task agrupada vai ao topo ou ao fim **do proprio grupo**; decidir e declarar se o grupo inteiro tambem ganha a operacao na CLI e no MCP
- [ ] `taskin priority <task> --top` e `--bottom`, exclusivos com o numero, `--before` e `--after` (a regra "exatamente uma forma" que a 105 ja tem)
- [ ] O mesmo no `set_priority` do MCP
- [ ] O dashboard passa a chamar as mesmas operacoes, em vez da logica propria do `usePrioritization` (depende da 106, que leva o dashboard para as operacoes nomeadas)
- [ ] Custo: topo grava 1 arquivo; fim de uma cauda sem `Priority` numera a cauda — medir e dizer ao usuario quantos arquivos foram gravados, como o `priority --before` ja diz
- [ ] Entrar no portao de compilacao da 106: acrescentar a operacao e esquecer uma superficie nao compila
- [ ] TDD, e documentacao nas quatro frentes (README da raiz, `packages/cli/README.md`, `docs/` e o site nos dois idiomas)
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

A task-101 deu ao dashboard os botoes de topo e fim. A CLI e o MCP ficaram com
numero absoluto e `--before`/`--after`, que exigem saber o alvo — para levar ao
topo e preciso antes descobrir qual e a primeira task da fila. E a operacao mais
rotineira da priorizacao, e o pedido foi explicito: precisa de atalho.

### Direcao da fila

Na ordem manual o **menor** numero fica no topo (`ordenarTarefas`, modo
`manual`). Topo e, portanto, um numero menor que o do primeiro; fim, maior que o
do ultimo numerado.

### O custo do fim

Tarefa sem `Priority` sempre ordena depois das numeradas. Levar uma tarefa ao
fim quando ha cauda sem numero obriga a numerar a cauda: com 4 tarefas, 1 e 2
numeradas e 3 e 4 sem, levar a 1 ao fim grava **3** arquivos (3, 4 e 1). No
cenario da 082, com 480 sem numero, sao 481. O custo e de uma vez so: depois
disso a cauda esta numerada e o proximo movimento custa 1. A CLI deve dizer
quantos arquivos gravou, para que isso nao aconteca em silencio.

### Ordem

Depois da 106. Feita antes, as operacoes nascem num contrato que ainda nao tem
o portao; feita depois, elas entram nele e as tres superficies derivam delas.
