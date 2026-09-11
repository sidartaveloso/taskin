# 🧩 Task 056 — A tela de --help esconde quatro comandos: gerar a ajuda a partir do proprio program

- Status: pending
- Type: fix
- Assignee: Sidarta Veloso

## Description

A tela de `taskin --help` e uma lista escrita a mao em `packages/cli/src/lib/help.ts`,
paralela a lista de comandos que o `index.ts` registra no commander. As duas
divergiram: a ajuda mostra **10** dos **14** comandos.

Ausentes: `review`, `stats`, `export` e `notify`. Quem so le a ajuda nao
descobre que existem.

## O que ha de cada lado

| registrado em `index.ts` | aparece no `--help` |
| --- | --- |
| `init` | sim (com o alias `setup`) |
| `list` | sim |
| `new` | sim |
| `start` | sim |
| `pause` | sim |
| `review` | **nao** |
| `finish` | sim |
| `stats` | **nao** |
| `config` | sim |
| `export` | **nao** |
| `lint` | sim |
| `dashboard` | sim |
| `mcp-server` | sim (com o alias `mcp`) |
| `notify` | **nao** |

O `help.ts` tem 142 linhas, quase todas um array `commands` com nome,
descricao, opcoes e exemplos digitados a mao. Nada garante que ele acompanhe
`index.ts` — e ja nao acompanha.

## O desenho

O commander ja conhece cada comando: nome, aliases, descricao, opcoes e
argumentos estao no `program.commands`. A ajuda deve ser **derivada** dele, nao
mantida em paralelo.

O que se perde ao derivar: os exemplos por comando, que sao escritos a mao e
tem valor real (`taskin dashboard --filter-open`, `taskin new -t feat -T ...`).
Esses continuam a mao — mas presos ao comando, e nao numa lista separada que
pode esquecer um comando inteiro.

Ou seja: derivar a **lista** e a **descricao**; manter a mao so os **exemplos**,
num mapa indexado pelo nome do comando. Um comando sem exemplo aparece do
mesmo jeito, so sem a secao de exemplos.

## Tasks

- [ ] `showCustomHelp` passa a receber o `program` e a percorrer
      `program.commands` em vez do array literal
- [ ] Exemplos num mapa por nome de comando; ausencia de exemplo nao esconde o
      comando
- [ ] Teste que compara o conjunto de comandos registrados com o conjunto que a
      ajuda renderiza — e falha se algum ficar de fora
- [ ] Conferir que os aliases (`ls`, `begin`, `stop`, `done`, `setup`, `mcp`)
      continuam aparecendo
- [ ] Changeset do `taskin`

## Notes

### E a mesma forma de defeito de outros dois desta semana

Uma copia a mao de algo que o codigo ja sabe, que diverge em silencio:

- o `turbo.json` declarava `outputs` num `pkg#task` e perdia o `dependsOn` da
  entrada base, porque a entrada especifica **substitui** a base;
- o workflow do site listava os pacotes de que ele depende, copiando o grafo de
  dependencias a mao, e esqueceu o `turbo.json`.

Nos tres casos a correcao e a mesma: derivar da fonte em vez de manter em
paralelo. O teste da ultima tarefa acima e o que impede a divergencia de
voltar.

### Relacionado

task-055 — comando de usuarios. Se ele nascer depois desta, entra na ajuda
sozinho.
