# 🧩 Task 052 — A tag de skip de CI esta errada: [skip-ci] nao pula CI em lugar nenhum

- Status: done
- Type: fix
- Assignee: Sidarta Veloso

## Description

O taskin marca os commits de mudanca de status com `[skip-ci]`, com hifen.
Nenhuma plataforma de CI reconhece essa forma. A tag correta e `[skip ci]`,
com espaco. Na pratica, todo commit de status que o taskin gera hoje —
`taskin start`, `taskin pause`, `taskin finish`, `taskin review`, e o
`pushAfterCreate` do `taskin new` — dispara o pipeline inteiro do projeto de
quem usa, exatamente o oposto do que a tag promete.

Alem de corrigir a tag, esta task torna a tag **configuravel**: quem usa
Azure DevOps (`***NO_CI***`), um GitLab com regra propria, ou simplesmente
quer que o pipeline rode, escolhe no `taskin init` e muda depois no
`taskin config`. O padrao e `[skip ci]`.

## O que foi medido nas fontes primarias

Levantamento feito na documentacao oficial, nao de memoria.

**GitHub Actions** — a pagina *Skipping workflow runs* lista exatamente cinco
strings: `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`,
`[actions skip]`. Alternativamente, o trailer `skip-checks: true` no fim da
mensagem, precedido de duas linhas em branco. `[skip-ci]` **nao** esta na
lista. Duas notas que valem registrar:

- as instrucoes de skip so valem para os eventos `push` e `pull_request` —
  um workflow disparado por `pull_request_target`, `schedule` ou
  `workflow_dispatch` roda de qualquer jeito
- a documentacao **nao** afirma nada sobre diferenciar maiusculas de
  minusculas. A afirmacao de que `[CI SKIP]` nao funciona nao esta apoiada na
  fonte, entao o taskin nao vai depender disso nem num sentido nem no outro

**GitLab** — ao contrario do que se costuma dizer, o GitLab **tem** skip
nativo: `[ci skip]` ou `[skip ci]` na mensagem, e a capitalizacao nao importa.
Existe tambem a push option `ci.skip` (git 2.10+), que nao pula pipeline de
merge request. O pipeline aparece como criado e com status *Skipped*. Politicas
de execucao podem desativar o skip.

**Bitbucket Pipelines** — aceita `[skip ci]` e `[ci skip]`, e a documentacao
diz explicitamente que a forma com hifen nao funciona e dispara o pipeline.

A interseccao das tres plataformas e `[skip ci]` e `[ci skip]`. Dai o padrao.

## A evidencia dentro deste repositorio

O `.github/workflows/ci.yml` (`Verificar`) e o `release.yml` rodam em todo push
para `main`, sem filtro de caminho — o `ci.yml` inclusive documenta que isso e
de proposito, porque o `pnpm lint` da raiz roda `lint:tasks`. Nenhum dos tres
workflows tem qualquer tratamento proprio de `[skip-ci]`. Ou seja: nao existe
nada compensando o defeito. Os commits de status estao rodando CI completa
desde sempre.

## Onde a string aparece hoje

Sete ocorrencias em codigo de producao, cada uma com a mensagem montada por
interpolacao no proprio ponto de uso:

| arquivo | o que monta |
| --- | --- |
| `packages/git-utils/src/git-service.ts` | commit de status, tres vezes |
| `packages/file-system-task-provider/src/auto-sync.ts` | `pushAfterCreate` e `squashTaskFileOnDone` |
| `packages/cli/src/commands/start.ts` | texto de sugestao (uma com `[skip-ci]`, outra ja com `[skip ci]`) |
| `packages/cli/src/commands/finish.ts` | texto de sugestao, duas vezes |
| `packages/cli/src/commands/review.ts` | texto de sugestao |
| `README.md` | promessa de feature |

A divergencia dentro do proprio `start.ts` — uma linha com hifen, outra com
espaco — e o sintoma de que a string esta duplicada em vez de vir de um lugar
so. Corrigir sete literais sem centralizar deixa o oitavo aparecer amanha.

## Desenho

**Uma fonte de verdade, pura, em `@opentask/taskin-git-utils`.** Um modulo
`commit-message` que exporta as tags reconhecidas, o padrao, um type guard, e
a funcao que monta a mensagem de status. Nada de I/O: e a peca que os testes
cobrem por inteiro.

**A tag desce por parametro, nao por leitura de arquivo.** O `GitService`
recebe a tag nas opcoes do construtor; `pushAfterCreate` e
`squashTaskFileOnDone` recebem no objeto de opcoes. Quem le o `.taskin.json` e
so a CLI, que ja tem o `ConfigManager`. Assim o `git-utils` e o provider
continuam testaveis sem tocar em disco, e o dashboard/MCP podem usar outra
origem de configuracao amanha.

**O schema aceita qualquer string; a CLI e que avisa.** Restringir o campo as
cinco tags do GitHub quebraria Azure DevOps e qualquer CI caseiro. Entao o
`ciSkipTag` e `z.string()` com default `[skip ci]`, string vazia significa
"nao marcar nada", e o `taskin config` imprime um aviso quando o valor nao esta
entre as formas reconhecidas — citando `[skip-ci]` pelo nome, que e o erro que
originou esta task.

## Tasks

- [x] `commit-message.ts` no `git-utils`: `CI_SKIP_TAGS`, `DEFAULT_CI_SKIP_TAG`,
      `isRecognizedCiSkipTag`, `appendCiSkipTag`, `buildTaskStatusCommitMessage`
- [x] `GitService` aceita `{ ciSkipTag }` no construtor e monta a mensagem pelo
      modulo novo, nas tres ocorrencias
- [x] `auto-sync`: `ciSkipTag` em `SyncConfig`, `PushAfterCreateOptions` e
      `SquashTaskFileOnDoneOptions`
- [x] `automation.ciSkipTag` no `TaskinConfigSchema`, com default `[skip ci]`
- [x] `ConfigManager.getCiSkipTag()` / `setCiSkipTag()`
- [x] `taskin config --ci-skip-tag <tag>`, secao interativa, e a tag no
      `--show`
- [x] `taskin init` pergunta a tag e grava o bloco `automation`
- [x] `start`, `finish` e `review` passam a tag ao `GitService` e usam ela nos
      textos de sugestao
- [x] README: trocar a promessa `[skip-ci]` pela tag configuravel
- [x] changeset

## O que mudou no caminho

**`pause` ficou de fora, e de proposito.** O commit que o `pause` faz e de
trabalho (`WIP: task-NNN`), nao de mudanca de status — ele nunca teve a tag, e
nao deve ter. A CI tem que rodar em cima de trabalho.

**Dois defeitos apareceram enquanto a correcao era feita:**

O `saveConfig` do `ConfigManager` tipava o parametro como `TaskinConfig`, que e
o tipo de **saida** do zod. Com um campo que tem default, o tipo de saida exige
o campo e o de entrada nao — quem quisesse salvar um config precisaria soletrar
o `ciSkipTag`. Entrou um `TaskinConfigInput` (`z.input`) e o `saveConfig` passou
a receber ele.

O `handleConfigCommand` lia `options['discord-webhook']` e
`options['notification-events']`. O commander entrega as opcoes em camelCase,
entao esses dois flags nunca chegavam ao proprio ramo: caiam no modo
interativo. Corrigido junto, com teste de regressao, porque e a mesma interface
de seis linhas que esta task reescreveu.

## Evidencia: como o pedido aparece na tela

Capturado do CLI compilado (`packages/cli/dist/index.js`) rodando num terminal
de verdade — pty alocada com `script` e com `expect`, nao stdout redirecionado.
Os codigos ANSI foram removidos; o texto e o resto e o que a pessoa ve.

### `taskin init`

O pedido entra depois da configuracao do provider e antes de escrever o
`.taskin.json`. As duas linhas de contexto existem porque "tag de skip de CI"
nao diz, sozinho, o que a escolha afeta.

```text
════════════════════════════════════════════════════════════
🎯  Initializing Taskin
════════════════════════════════════════════════════════════

ℹ Using provider from command line: fs

ℹ Setting up task provider: 📁 File System

ℹ Creating sample task...
✓ ✓ Created sample task task-001-setup-project.md

ℹ Taskin appends a tag to the commits it writes itself — status changes and
ℹ task files — so they do not trigger your pipeline.

? Tag for Taskin commits:
❯ [skip ci] — GitHub, GitLab and Bitbucket (recommended)
  [ci skip] — GitHub, GitLab and Bitbucket
  [no ci] — GitHub Actions only
  [skip actions] — GitHub Actions only
  [actions skip] — GitHub Actions only
  none — do not mark the commits, let CI run
  custom… — another CI (Azure DevOps uses ***NO_CI***)

↑↓ navigate • ⏎ select
```

Cada item diz **onde funciona**, e nao so como se escreve. Era a informacao que
faltava: as cinco formas do GitHub parecem intercambiaveis ate alguem rodar
GitLab ou Bitbucket. Em CI (`CI=true`) o prompt nao aparece e vale o padrao;
`--ci-skip-tag <tag>` tambem pula a pergunta.

### `taskin config`

A secao nova e a segunda do menu, logo abaixo de Automation level:

```text
════════════════════════════════════════════════════════════
⚙️  Configure Taskin
════════════════════════════════════════════════════════════

? What would you like to configure?
❯ 🤖 Automation level
  ⏭️  CI skip tag
  🔔 Discord notification
  🔔 Telegram notification

↑↓ navigate • ⏎ select
```

Escolhida a secao, a tela mostra o que ja esta valendo antes de oferecer a
lista — a mesma lista do `init`, para nao haver dois vocabularios para a mesma
escolha:

```text
════════════════════════════════════════════════════════════
⏭️  Configure CI Skip Tag
════════════════════════════════════════════════════════════

Current tag: [skip ci]

Taskin appends this to the commits it writes itself — status changes and
task files — so they do not trigger your pipeline.

? Tag for Taskin commits:
❯ [skip ci] — GitHub, GitLab and Bitbucket (recommended)
  [ci skip] — GitHub, GitLab and Bitbucket
  [no ci] — GitHub Actions only
  [skip actions] — GitHub Actions only
  [actions skip] — GitHub Actions only
  none — do not mark the commits, let CI run
  custom… — another CI (Azure DevOps uses ***NO_CI***)

↑↓ navigate • ⏎ select
```

O `custom…` abre um campo livre e cai no mesmo aviso do modo nao-interativo:

```text
✔ Tag for Taskin commits: custom… — another CI (Azure DevOps uses ***NO_CI***)
? Tag to append: ***NO_CI***

════════════════════════════════════════════════════════════
⚙️  Configure CI Skip Tag
════════════════════════════════════════════════════════════

✓ CI skip tag set to ***NO_CI***

⚠️  This tag is not one GitHub, GitLab or Bitbucket documents.
   Documented tags: [skip ci], [ci skip], [no ci], [skip actions], [actions skip]
   Keeping it anyway — a self-hosted pipeline can match whatever it likes.
```

### O aviso sobre `[skip-ci]`

Quem digitar a forma que originou esta task recebe uma linha a mais, com o
motivo e a correcao:

```text
$ taskin config --ci-skip-tag "[skip-ci]"

✓ CI skip tag set to [skip-ci]

⚠️  This tag is not one GitHub, GitLab or Bitbucket documents.
   "[skip-ci]" with a hyphen is not recognized anywhere — it triggers CI.
   Did you mean "[skip ci]", with a space?
   Documented tags: [skip ci], [ci skip], [no ci], [skip actions], [actions skip]
   Keeping it anyway — a self-hosted pipeline can match whatever it likes.
```

O `✓` vem **antes** do `⚠️` de proposito: a tag foi gravada. O aviso e conselho,
nao veto — um pipeline proprio pode casar o que quiser, e recusar aqui
quebraria Azure DevOps.

### A tag vazia tem nome na tela

`none` grava string vazia, e nem o `config` nem o `--show` imprimem um campo em
branco:

```text
$ taskin config --ci-skip-tag none
✓ CI skip tag set to no tag — CI runs on status commits

$ taskin config --show
🤖 Automation
  Level: assisted
  Auto-commit status changes: ✓ Yes
  Auto-commit on pause: ✓ Yes
  Auto-commit on finish: ✗ No
  CI skip tag: no tag — CI runs on status commits
```

## Notes

Nao ha migracao a fazer em `.taskin.json` existente: o campo e opcional e o
default do zod entrega `[skip ci]` para quem nao tem o bloco. Projetos que ja
dependiam de `[skip-ci]` nao dependiam de nada — a tag nunca funcionou.

Fontes:

- <https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/skipping-workflow-runs>
- <https://docs.gitlab.com/ci/pipelines/>
