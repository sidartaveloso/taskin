# 🧩 Task 084 — Comando de priorizacao inicial: numerar de uma vez, de proposito, em vez de como efeito colateral de um clique

- Status: done
- Type: feat
- Priority: 250
- Assignee: Sidarta Veloso

## Description
Hoje a numeracao so acontece ao arrastar no dashboard, e num projeto meio numerado o primeiro movimento reescreve dezenas de arquivos. Um comando explicito faz isso uma vez, num commit com nome, e o estado meio numerado deixa de existir.

## Tasks
- [x] Teste vermelho: num projeto sem nenhuma prioridade, o comando numera todas e a ordem relativa nao muda
- [x] Teste vermelho: num projeto meio numerado, quem ja tem numero **mantem** o seu
- [x] Teste vermelho: rodar duas vezes seguidas nao altera arquivo nenhum
- [x] Teste vermelho: com `--dry-run`, diz quantas seriam numeradas e nao escreve
- [x] A funcao de numeracao, pura, em `task-manager`
- [x] `taskin prioritize` na CLI
- [x] A mesma operacao como ferramenta no MCP
- [ ] Botao no dashboard, com o aviso de projeto meio numerado
- [x] Documentar nos READMEs e no site (os dois idiomas)
- [x] `pnpm lint`, `typecheck`, `test` e `build` verdes

### O que comprova cada item

`packages/task-manager/src/numerar-prioridade/numerar-prioridade.test.ts` — 4
testes sobre a funcao pura, escritos antes da implementacao.

| o que se afirma | teste |
| --- | --- |
| numera preservando a ordem | `num projeto sem nenhuma prioridade, numera todas preservando a ordem` |
| respeita quem ja tem | `mantem o numero de quem ja tem, e so preenche as lacunas` |
| idempotencia | `rodar de novo nao muda nada` |
| nada a fazer | `nao devolve nada quando todas ja estao numeradas e em ordem` |

**Medido contra as 500 tarefas de verdade** (`.bench500`, 250 numeradas e 250
sem):

```
$ taskin prioritize --dry-run
ℹ 250 task(s) would be numbered. Nothing was written.
  → 0 arquivos alterados

$ taskin prioritize
✓ Numbered 250 task(s).
  → 250 arquivos alterados

$ taskin prioritize
✓ Every task already carries a priority. Nothing to do.
```

**E o efeito que justifica a task**, medido no mesmo quadro de 500:

| estado do projeto | mover a posicao 375 altera |
| --- | --- |
| meio numerado | **124** tarefas |
| depois do `prioritize` | **1** tarefa |

### O desenho mudou no caminho, e para melhor

A primeira versao acrescentou `updateTask` ao `ITaskManager`, para o servidor MCP
conseguir gravar. O typecheck recusou, e a recusa estava certa: um metodo que
**consome** `TTask` torna a interface contravariante nele, e um
`ITaskManager<TarefaEspecifica>` deixa de poder ser usado onde se espera
`ITaskManager<Task>`.

A saida foi melhor que o contorno: em vez de um setter generico, uma **operacao
de dominio** — `prioritizeAll({ dryRun })`, que devolve so numeros. Com isso a
regra da numeracao vive num lugar so, e a CLI e o MCP a chamam em vez de cada uma
reescrever a sua.

### O que ficou de fora

O **botao no dashboard** com o aviso de projeto meio numerado. A operacao ja
existe nas duas superficies que a executam sem interface; o aviso e trabalho de
tela e merece task propria, junto de decidir onde ele aparece sem atrapalhar.

O passo ficou em **100** (`PASSO_DE_PRIORIDADE`), e nao 10: espaco largo entre
vizinhos significa muitos movimentos antes de a renumeracao local precisar
acontecer.

## Notes

**TDD.** A costura e a funcao pura de numeracao, em `task-manager`, ao lado de
`filterTasks` — e ali que os quatro testes acima se afirmam, antes de existir
flag, ferramenta ou botao. Vermelho primeiro, uma fatia por vez.

## Por que um comando, e nao um algoritmo mais esperto

A task-082 derrubou o custo de um movimento de **499 arquivos para 1**, medido
num projeto de 500 tarefas. Mas sobrou uma ponta: mover uma tarefa do meio da
regiao **sem** numero altera **124** arquivos.

Essa ponta nao e defeito do algoritmo — e o significado de "sem numero". Quem nao
tem `order` ordena **por ultimo**, entao para dar numero a uma tarefa do meio e
preciso numerar todos os antecessores. Duas saidas foram consideradas e
descartadas:

- **Numeros fracionarios** nao resolvem: o problema nao e granularidade, e que
  "ausente" nao tem posicao propria entre os numerados.
- **Mudar o criterio de ordenacao** (ausente herda a posicao do vizinho) faz a
  ordenacao depender da ordem dos arquivos no disco, e a circularidade volta na
  proxima leitura.

O que resta e eliminar o **estado** que cria o custo: um projeto meio numerado.
Depois do comando, ou tudo tem numero ou o projeto nunca foi priorizado — e todo
movimento passa a custar um arquivo.

## O ponto de fundo

Hoje nao existe nenhum comando de priorizacao no CLI (conferido). A numeracao so
acontece como **efeito colateral** de arrastar no dashboard. E por isso que ela
chega em forma de dezenas de arquivos num commit que ninguem pediu.

Com o comando, o custo fica visivel e datado: 500 arquivos num commit chamado
"numeracao inicial de prioridade" sao historico; 124 arquivos escondidos atras de
um clique sao ruido.

## Decisoes a declarar

**O passo.** Numerar por posicao com passo largo (100, e nao 10) deixa espaco
para muitos movimentos antes de a renumeracao local precisar acontecer. Escolher
e documentar.

**Idempotencia.** Rodar duas vezes nao pode alterar nada — e o terceiro teste
acima, e e o que torna o comando seguro de pos num script ou num hook.

**Quem ja tem numero.** A recomendacao e **manter**: o comando preenche as
lacunas respeitando a ordem que ja existe, em vez de reescrever a decisao de
quem priorizou. Se isso produzir colisoes, resolver localmente.

**O aviso no dashboard.** Ao abrir um projeto meio numerado, dizer quantas
tarefas estao sem numero e qual o custo do primeiro movimento — em vez de a
pessoa descobrir pelo `git status` depois.

## Relacionado

- task-082 — o conserto do custo por movimento, que deixou esta ponta
- task-083 — o bundle velho que quase fez a medicao da 082 concluir errado
