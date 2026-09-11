# 🧩 Task 052 — A tag de skip de CI esta errada: [skip-ci] nao pula CI em lugar nenhum

- Status: in-progress
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

- [ ] `commit-message.ts` no `git-utils`: `CI_SKIP_TAGS`, `DEFAULT_CI_SKIP_TAG`,
      `isRecognizedCiSkipTag`, `appendCiSkipTag`, `buildTaskStatusCommitMessage`
- [ ] `GitService` aceita `{ ciSkipTag }` no construtor e monta a mensagem pelo
      modulo novo, nas tres ocorrencias
- [ ] `auto-sync`: `ciSkipTag` em `SyncConfig`, `PushAfterCreateOptions` e
      `SquashTaskFileOnDoneOptions`
- [ ] `automation.ciSkipTag` no `TaskinConfigSchema`, com default `[skip ci]`
- [ ] `ConfigManager.getCiSkipTag()` / `setCiSkipTag()`
- [ ] `taskin config --ci-skip-tag <tag>`, secao interativa, e a tag no
      `--show`
- [ ] `taskin init` pergunta a tag e grava o bloco `automation`
- [ ] `start`, `pause`, `finish` e `review` passam a tag ao `GitService` e usam
      ela nos textos de sugestao
- [ ] README: trocar a promessa `[skip-ci]` pela tag configuravel
- [ ] changeset

## Notes

Nao ha migracao a fazer em `.taskin.json` existente: o campo e opcional e o
default do zod entrega `[skip ci]` para quem nao tem o bloco. Projetos que ja
dependiam de `[skip-ci]` nao dependiam de nada — a tag nunca funcionou.

Fontes:

- <https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/skipping-workflow-runs>
- <https://docs.gitlab.com/ci/pipelines/>
