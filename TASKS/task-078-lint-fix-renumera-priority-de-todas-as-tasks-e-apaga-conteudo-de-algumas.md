# 🧩 Task 078 — lint --fix renumera Priority de todas as tasks e apaga conteudo de algumas

- Priority: 900
- Status: in-progress
- Type: fix
- Assignee: Sidarta Veloso

## Description
Rodando 'taskin lint --fix' no geohub, 201 arquivos de task foram modificados: as prioridades foram renumeradas em massa (ex.: task-007 de 70 para 50) e 93 linhas de conteudo foram APAGADAS de dois arquivos (task-228 e task-238), incluindo titulo, descricao e itens. Nenhuma dessas mudancas foi pedida — o comando foi invocado para formatar UM arquivo recem-criado.

## O que aconteceu

Invoquei `taskin lint --fix` no geohub para normalizar **um** arquivo de task
recem-criado. O comando modificou **201 arquivos**:

- **renumeracao em massa de `Priority`** — `task-007` de 70 para 50, e assim por
  toda a arvore;
- **93 linhas de conteudo apagadas** em `task-228` e `task-238`: titulo,
  `## Description` inteira, `## Tasks` e os subitens.

O diff nao tinha **nenhuma** adicao que nao fosse `Priority`. Ou seja: o comando
so removeu e renumerou.

Recuperado com `git checkout --` porque nada disso tinha sido commitado. Se
tivesse, ou se a arvore estivesse suja de outra sessao, seria perda real.

## Por que isso e grave alem do estrago

1. **O comando se chama `lint --fix`.** A expectativa razoavel de um `--fix` e
   formatacao idempotente, nao reordenacao semantica do backlog nem remocao de
   secoes. `Priority` e decisao humana; um formatador nao deveria toca-la.
2. **O nivel de automacao `autopilot` commita sozinho.** No geohub esse estrago
   ficou visivel porque meus commits usam pathspec explicito. Com `git add -A`,
   ele entraria no historico sem ninguem ver.
3. **O escopo surpreende.** Pedi para arrumar um arquivo; ele mexeu em todos.

## Tasks

- [ ] Reproduzir num repositorio de fixture e identificar o que dispara a
      renumeracao e a remocao — sao provavelmente dois defeitos distintos.
- [ ] `lint --fix` nao deve alterar `Priority`. Se houver caso legitimo (por
      exemplo normalizar valor invalido), precisa ser opt-in e dizer o que fara.
- [ ] Investigar a remocao de conteudo em `task-228`/`task-238`: descobrir o que
      esses dois tem de diferente. **Suspeita:** ha DOIS arquivos com o numero
      228 no geohub (`task-228-corrigir-autenticacao-...` e
      `task-228-geocode-reverse-...`), entao colisao de numero pode estar fazendo
      um sobrescrever o outro.
- [ ] Limitar o escopo ao alvo: `lint --fix <id>` nao deveria varrer a arvore.
- [ ] Teste que prove que `lint --fix` e idempotente e nao remove conteudo.

## Notes

Encontrado em 2026-09-14, no geohub. A pista da colisao de numero conecta com a
task-077 (autoSync): o `syncBeforeCreate` existe justamente para evitar numero
duplicado, e esta desligado porque a unica estrategia disponivel e rebase.
