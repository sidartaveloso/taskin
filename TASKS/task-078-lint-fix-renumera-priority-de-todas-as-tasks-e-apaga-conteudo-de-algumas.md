# 🧩 Task 078 — lint --fix renumera Priority de todas as tasks e apaga conteudo de algumas

- Priority: 1378
- Status: paused
- Type: fix
- Assignee: sidartaveloso
- Difficulty: 1

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

- [x] Reproduzir num repositorio de fixture e identificar o que dispara a
      renumeracao e a remocao — **nao reproduz**, ver abaixo
- [x] Investigar a suspeita de colisao de numero — **descartada**
- [x] Teste que prove que `lint --fix` e idempotente e nao remove conteudo
- [x] Rede de seguranca: um resultado que perde conteudo nao e gravado
- [ ] `lint --fix` nao deve alterar `Priority` — nao reproduzido; fica aberto
- [ ] Limitar o escopo ao alvo: `lint --fix <id>` nao deveria varrer a arvore

### O que foi tentado, e o que deu

**Nao reproduz.** Quatro tentativas, da mais simples a mais fiel:

| tentativa | resultado |
| --- | --- |
| fixture com dois arquivos de mesmo numero, build local | 0 arquivos alterados |
| fixture com linha `Algo: valor` no meio do corpo | 0 alterados |
| fixture no formato antigo (`## Status`) e tarefa sem `Priority` | 1 alterado, e **corretamente**: so o cabecalho migrou |
| **as 361 tarefas reais do geohub**, com o binario **4.3.0** que ele usa | **0 alterados** |

A suspeita de colisao de numero foi testada com quatro arquivos `task-228-*` de
conteudos diferentes, no binario 4.3.0: nada aconteceu. O geohub de fato tem
colisoes (228, 238, 253, 321, 322), e as duas tarefas afetadas sao as duas
primeiras — mas a colisao sozinha nao dispara nada.

A explicacao mais provavel e que o gatilho **sumiu com o conserto**: o relato diz
que o comando foi invocado para normalizar *um arquivo recem-criado*, e que tudo
foi recuperado com `git checkout --`. Aquele arquivo estava num estado que nao
existe mais.

### O que foi feito, ja que a causa nao aparece

Fechar a **classe** de falha, em vez de cacar o gatilho: `fixTaskFile` passou a
comparar o que entra com o que sairia, e **recusa gravar** um resultado que
perca uma secao do corpo ou o titulo. A migracao de metadados pode reescrever o
cabecalho — `## Status`, `## Type` e `## Assignee` viram linhas —, e nada mais.

Quando a recusa acontece, ela **fala**: diz qual arquivo, o que se perderia, e
pede o relato. O problema passa a aparecer como arquivo nao corrigido, e nao
como conteudo perdido.

Quatro testes em `task-validator.preserva-conteudo.test.ts`. Tres sao guardas de
regressao — passam porque a implementacao atual ja preserva. O quarto prova que
a **recusa existe**: sabota a conversao para devolver so o cabecalho e afirma
que o arquivo ficou intacto, verificando tambem que a sabotagem foi exercida —
senao o teste passaria por nao ter havido mudanca, e nao pela recusa.

### O que continua aberto, e por que

A **renumeracao de `Priority`** nao foi reproduzida em nenhuma tentativa, entao
nao ha o que consertar sem adivinhar. Fica registrado: se acontecer de novo,
**commitar ou copiar a arvore suja antes de recuperar** — foi o `git checkout --`
que levou a evidencia junto.

O **escopo do comando** (`lint --fix <id>` varrer a arvore inteira) e um incomodo
real e independente deste defeito. Merece task propria.

## Notes

Encontrado em 2026-09-14, no geohub. A pista da colisao de numero conecta com a
task-077 (autoSync): o `syncBeforeCreate` existe justamente para evitar numero
duplicado, e esta desligado porque a unica estrategia disponivel e rebase.
