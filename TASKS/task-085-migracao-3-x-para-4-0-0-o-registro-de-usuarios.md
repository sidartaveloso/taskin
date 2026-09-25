# 🧩 Task 085 — Migracao 3.x para 4.0.0: o registro de usuarios perde o historico mesmo com git mv, e o canonico pode ficar fora do Git

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Difficulty: 2
- Priority: 400
- Group: antes-da-5

## Description
Quem sobe do `taskin@3.x` para o `taskin@4.0.0` (`@opentask/taskin-file-system-provider@3.1.0`) tem o registro de usuarios migrado da raiz do projeto para `.taskin/.taskin-users.json`. No caminho `legacy` a migracao esta certa: `fixUsersFileLocation` chama `moveFile`, que usa `git mv` quando o arquivo e versionado, e o historico do registro continua.

O problema esta no caminho `both` — projeto que ja tem o canonico em `.taskin/` **e** ainda tem o arquivo antigo na raiz. Ali o `git mv` leva o arquivo da raiz para `.taskin/.taskin-users.legacy.json`, e o informativo seguinte do lint manda **apagar** esse arquivo depois de comparar o conteudo a mao. Ou seja: o `git mv` preserva com cuidado um historico que o proprio fluxo instrui a jogar fora no passo seguinte. O arquivo que sobrevive e o canonico, que nao recebe nenhuma ligacao com o registro antigo.

Junto disso ha um segundo defeito, mais silencioso: **o canonico costuma estar fora do Git**. O `initialize()` escreve `.taskin/.taskin-users.json`, mas nada o adiciona ao indice, e nenhuma checagem do lint repara nisso. O registro de usuarios e dado de time, nao cache local — se ele ficar untracked, o time inteiro segue sem ver os usuarios e os assignees continuam sem resolver na maquina dos outros, que e exatamente a classe de problema que a 4.0.0 veio corrigir.

O desfecho pratico de uma migracao seguindo as instrucoes a risca e um commit que **remove** o registro da raiz sem colocar nada no lugar.

## Tasks
- [x] Teste vermelho reproduzindo o caso `both` ponta a ponta, afirmando o estado final do indice do Git, nao a chamada do `git mv` — `describe('migracao 3.x → 4.x no caso both — o estado final do indice do Git')` em `packages/file-system-task-provider/src/users-file-location.test.ts`: le `git status --porcelain` (`D ` raiz, `A ` canonico, `??` estacionado) e, seguindo o lint a risca, afirma que o `HEAD` tem o canonico e nao tem a raiz. Contra o codigo antigo, 7 dos testes novos falham; com o fix passam. `pnpm --filter @opentask/taskin-file-system-provider exec vitest run src/users-file-location.test.ts`
- [x] Lint passa a apontar registro canonico existente mas nao versionado, em projeto com Git (aviso, nao erro — projeto sem Git e caso legitimo) — `validateUsersFileLocation` em `users-file-location.ts`; testes em `describe('validateUsersFileLocation — registro canonico fora do Git')` (avisa sem commit, cala depois do commit, cala sem Git, cala se o `.gitignore` exclui, aponta junto com o legado antes do fix)
- [x] Rever o destino do `git mv` no caso `both`: mover para o caminho estacionado gasta preservacao de historico num arquivo destinado a ser apagado — `parkLegacy` em `users-file-location.ts`: o estacionado sai por `fs.rename` e fica fora do indice; se a raiz era versionada, vai para o indice `git rm --cached` da raiz **e** `git add` do canonico (quando nao versionado nem ignorado). Teste `lets git follow the history when the contents are alike...` prova que o `git diff --cached -M` ve o `R`. O caso `legacy` segue com `git mv`
- [x] `suggestion` do registro estacionado passa a dizer o que fazer com o Git, e nao so com o conteudo: a remocao do estacionado e a adicao do canonico precisam entrar no mesmo commit — testes `tells, for the parked copy, what to do with Git...` (`rm` + `git add .taskin/.taskin-users.json` + `same commit`) e `suggests git rm for a parked copy that an older lint put in the index`
- [x] Cobrir projeto sem Git e arquivo ignorado pelo `.gitignore` — a migracao nao pode depender de Git — testes `does not add a canonical registry that .gitignore excludes`, `touches no index when the root file was never tracked`, `stays quiet on a project without git`, `stays quiet when .gitignore excludes the registry on purpose`, alem dos que ja existiam (`falls back to a plain rename outside a git repository`)
- [x] Documentar o passo de commit da migracao no README do provider e no guia de upgrade — secao `O commit da migração` em `packages/file-system-task-provider/README.md`; o guia de upgrade nao existia e nasceu em `docs/UPGRADE.md` (linkado no README raiz), com o `-M15%` do `git log --follow`. Changeset em `.changeset/registro-de-usuarios-no-git.md`

## Notes
**Versoes.** O comportamento nasce em `@opentask/taskin-file-system-provider@3.1.0`, publicado no `taskin@4.0.0`, e segue igual ate `3.2.4` / `taskin@4.3.0`. Antes disso (`<= 3.0.2` / `taskin@3.x`) o registro vivia em `<raiz>/.taskin-users.json`.

**Onde esta o codigo.** `packages/file-system-task-provider/src/users-file-location.ts` — `moveFile` (o `git mv`), `fixUsersFileLocation` (os ramos `legacy` e `both`) e `validateUsersFileLocation` (as mensagens).

**Como reproduzir.** Projeto em `3.x` com o registro versionado na raiz, canonico ja presente em `.taskin/`, rodando o lint da `4.x`:

```
pnpm taskin lint --fix
git status --short
# D  .taskin-users.json                    <- git mv, historico preservado
# A  .taskin/.taskin-users.legacy.json     <- destino estacionado
# ?? .taskin/.taskin-users.json            <- o registro que de fato e lido, fora do Git
```

Seguindo o informativo do lint, que manda copiar os usuarios que faltam e apagar o estacionado:

```
git rm .taskin/.taskin-users.legacy.json
git status --short
# D  .taskin-users.json
# ?? .taskin/.taskin-users.json            <- nada liga um ao outro, e ele nem esta no commit
```

**Sobre a deteccao de rename.** Vale lembrar no fix e na documentacao que o Git nao grava rename no commit — `git mv` e `mv` + `git rm` + `git add`, e a renomeacao e inferida por similaridade na hora do diff. Isso tem duas consequencias aqui: a condicao real e a remocao e a adicao cairem **no mesmo commit**, e quando o conteudo muda muito na mudanca de lugar a similaridade pode ficar abaixo do limiar padrao de 50%. E o caso comum nessa migracao, porque o registro da raiz costuma ter so o usuario sintetico que o `initialize()` antigo semeava, enquanto o canonico ja tem o time todo: numa migracao real a similaridade ficou em 15%, invisivel para o `git log --follow` sem um `-M15%` explicito.

**Decisoes do fix.** O `--fix` so mexe no indice para completar a saida de um arquivo que ja era versionado: raiz fora do Git nao gera `git add` do canonico (o aviso novo do lint cuida disso). Canonico excluido pelo `.gitignore` nao e adicionado nem gera aviso — e escolha do projeto; nesse caso a remocao da raiz ainda vai para o indice, porque o arquivo da raiz nunca foi lido. O `initialize()` continua sem fazer `git add` do registro que semeia: o aviso do lint aponta, e adicionar ao indice num `init` seria surpresa.

**Testes fora deste pacote.** `design-vue`, `dashboard` e `ui-sense` nao rodam no sandbox (sem o navegador do Playwright). O e2e da CLI (`src/cli.e2e.test.ts`) falha 1–2 testes diferentes a cada execucao, tambem com o codigo da `main` — instabilidade anterior a esta task.
