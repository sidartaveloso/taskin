# @opentask/taskin-git-utils

## 3.2.0

### Minor Changes

- 7a43f57: O status de uma task tem a branch padrão do remoto como quadro compartilhado.
  
  - `@opentask/taskin-git-utils`: `detectDefaultBranch(cwd)` escolhe `develop`, senão `main`, senão `master`, olhando as refs locais e as de `origin/*`, sem rede, e devolve `null` em vez de adivinhar. `GitService.publishTaskStatusChange(taskId, status, defaultBranch)` publica só o arquivo da task (e `TASKS/assets/task-<id>/`) em `origin/<defaultBranch>`, sem trocar de branch, sem stash e sem tocar no índice nem na árvore; funciona numa worktree com a branch padrão aberta em outro checkout.
  - `@opentask/taskin-task-manager`: `ITaskProvider.describePublish`, opcional, diz como publicar só uma task.
  - `@opentask/taskin-file-system-provider`: `describePublish` devolve os caminhos da task e o comando `git add`/`git commit` restrito a eles.
  - `taskin`: `taskin config --level autopilot` detecta e grava `automation.defaultBranch`; o menu interativo a pergunta; `--default-branch <branch>` grava e o `--show` mostra. Em autopilot sem o campo, a detecção vale em memória. Fora do autopilot, `start` e `finish` ensinam a publicar só a task, no lugar do `git add TASKS/… && git commit` sem pathspec.
- 8934ce2: **Mudança de comportamento:** os commits de status que o taskin grava sozinho
  (`start`, `review`, `finish`, `new` e o caminho pelo MCP) passam a sair em
  **inglês** — `docs(TASKS): task-042 - update status to in-progress [skip ci]`
  no lugar de `atualiza status para in-progress`. Para continuar em português,
  declare `"commitLanguage": "pt-BR"` no bloco `automation` do `.taskin.json`, ou
  rode `taskin config --commit-language pt-BR`.
  
  - `@opentask/taskin-git-utils`: `buildTaskStatusCommitMessage` aceita
    `language` (`en`, o padrão, ou `pt-BR`) e o `GitService` aceita
    `commitLanguage`. Novos `COMMIT_LANGUAGES`, `DEFAULT_COMMIT_LANGUAGE`,
    `isCommitLanguage` e `resolveCommitLanguage`, que devolve `en` para um valor
    desconhecido.
  - `@opentask/taskin-types`: `automation.commitLanguage`, opcional e de texto
    livre, para que um valor errado escrito a mão não invalide o arquivo inteiro.
  - `taskin`: `taskin config --commit-language <en|pt-BR>` grava o idioma e recusa
    os outros; o menu interativo o pergunta e o `--show` o mostra. Um valor
    desconhecido no `.taskin.json` cai no inglês sem derrubar o comando.
- 5ca0c91: `taskin start`, `review`, `finish` e o MCP funcionam numa worktree. O commit de status vai para a branch corrente, só com o arquivo da task, sem stash nem `git checkout` da branch padrão. Com `autoSync` e `defaultBranch`, o mesmo status é publicado em `origin/<defaultBranch>`; falha de publicação avisa o motivo e o status fica comitado. Sem remoto `origin`, basta o commit local.
  
  - `@opentask/taskin-git-utils`: `publishTaskStatusChange` devolve `noRemote: true` quando não há `origin`. `commitTaskStatusChangeOnBranch` fica obsoleto: faz stash e checkout, o que falha numa worktree.
  - `@opentask/taskin-types`: a documentação de `autoSync` e `defaultBranch` descreve o que passa a acontecer.

### Patch Changes

- Updated dependencies [ad0d07c]
- Updated dependencies [8934ce2]
- Updated dependencies [5ca0c91]
  - @opentask/taskin-types@2.7.0

## 3.1.1

### Patch Changes

- 570e727: Os pacotes voltam a carregar no Node ESM. O `@opentask/taskin-utils@1.1.1` saiu com `export * from './security'`, sem a extensão `.js`, e o `@opentask/taskin-git-utils@3.1.0` saiu sem os próprios arquivos: o `.gitignore` da raiz (`**/src/**/*.js`) descartava `dist/src/*.js` do tarball, e só o `main` entrava. Como o provider fs fixa os dois, `import('@opentask/taskin-file-system-provider')` falhava com `ERR_MODULE_NOT_FOUND` em qualquer consumidor ESM. O git-utils passa pelo `fix-esm-extensions` e declara `files`. O utils já gerava saída válida e só precisava ser republicado.

## 3.1.0

### Minor Changes

- 9d292f1: Os commits automáticos passam a levar só o que a mensagem diz.
  
  O commit de status (`start`, `pause`, `finish`, `review` e o `start_task`/
  `finish_task` do MCP) fazia `git add` do arquivo da task e depois `git commit`
  sem caminho, e o `git commit` sem caminho grava o index inteiro: o que a pessoa
  tinha deixado staged ia junto, sob uma mensagem de status. Agora o commit
  recebe os caminhos, e o resto do index fica como estava. O squash do
  `autoSync` tinha o mesmo defeito e a mesma correção.
  
  O commit de trabalho (`pause`, e `finish` em autopilot) ganha
  `GitService.commitWork`: antes do `git add -A`, ele olha cada mudança e recusa
  quando alguma parece sensível — arquivo `.env`, chave privada, arquivo de
  credenciais, ou linha adicionada com um token. Nada é staged; a CLI mostra o
  arquivo, a linha e o motivo. O corpo do commit lista os arquivos.
  
  O git passa a rodar sem shell nesses caminhos: um título de task com aspas ou
  `$(...)` vai literal para a mensagem.

### Patch Changes

- Updated dependencies [342a312]
- Updated dependencies [eba94c1]
  - @opentask/taskin-types@2.6.0

## 3.0.6

### Patch Changes

- Updated dependencies [23c11ed]
  - @opentask/taskin-types@2.5.0

## 3.0.5

### Patch Changes

- Updated dependencies [37a0b34]
  - @opentask/taskin-types@2.4.0

## 3.0.4

### Patch Changes

- Updated dependencies [f84d9c6]
- Updated dependencies [0f83ec2]
  - @opentask/taskin-types@2.3.0

## 3.0.3

### Patch Changes

- Updated dependencies [6bebe35]
  - @opentask/taskin-types@2.2.0

## 3.0.2

### Patch Changes

- 2c402e9: A tag de skip de CI passa a ser `[skip ci]`, e vira configuravel
  
  Os commits que o Taskin escreve sozinho — mudanca de status, arquivo de task —
  vinham marcados com `[skip-ci]`, com hifen. Nenhuma plataforma reconhece essa
  forma: o GitHub Actions documenta cinco strings e essa nao esta entre elas, o
  Bitbucket diz explicitamente que a variante com hifen dispara o pipeline, e o
  GitLab so pula com `[skip ci]` ou `[ci skip]`. Na pratica cada `taskin start`,
  `pause`, `finish` e `review` rodava a CI inteira do projeto de quem usa,
  exatamente o contrario do que a tag prometia.
  
  O padrao agora e `[skip ci]`, a unica forma que as tres plataformas aceitam.
  
  A tag tambem deixou de ser literal espalhada pelo codigo e virou configuracao:
  
  - `taskin init` pergunta qual usar, ou aceita `--ci-skip-tag <tag>`
  - `taskin config --ci-skip-tag <tag>` muda depois, e a secao interativa lista
    as formas documentadas
  - `none` em qualquer um dos dois grava tag vazia, para quem quer que a CI rode
  - uma tag fora da lista e aceita com aviso, nao recusada: Azure DevOps usa
    `***NO_CI***` e um pipeline proprio pode casar o que quiser
  
  O campo e `automation.ciSkipTag` no `.taskin.json`. Quem nao tem o campo recebe
  `[skip ci]` pelo default do schema — nao ha migracao a fazer.
  
  De quebra, `taskin config --discord-webhook` e `--notification-events` voltaram
  a funcionar. O commander entrega as opcoes em camelCase e o comando lia as
  chaves com hifen, entao esses dois flags caiam no modo interativo em vez de no
  proprio ramo.
- Updated dependencies [2c402e9]
  - @opentask/taskin-types@2.1.1

## 3.0.1

### Patch Changes

- Updated dependencies [346f1d4]
  - @opentask/taskin-types@2.1.0

## 3.0.0

### Major Changes

- b4b259e: Abre as primitivas de sincronização no `IGitService` e corrige o diff de arquivo
  único.
  
  O auto-sync da CLI (push/pull/squash) e o commit em ramo configurado precisavam
  de operações que o `IGitService` não expunha. Elas existiam soltas, então o
  provider de arquivos falava com o git por fora do contrato.
  
  ## API nova
  
  `IGitService` ganhou `fetch`, `rebase`, `push`, `abortRebase` e `checkoutFile`,
  e `commitTaskStatusChangeOnBranch` ganhou o parâmetro opcional `defaultBranch` —
  com ele, o commit de status vai para o ramo configurado e volta para o ramo
  original, preservando as mudanças locais.
  
  ## Correção
  
  `getSingleFileDiff` devolvia um objeto com `path: undefined` quando a linha de
  numstat tinha menos de três campos, em vez de `null`. Não era crash: era dado
  silenciosamente errado descendo para as métricas. Agora retorna `null`, como o
  caso de arquivo binário já fazia.
  
  `parseCommits` e `getBlame` foram reescritos para não indexar às cegas a saída
  do git. Mesmo comportamento, sem depender de o comando externo devolver sempre a
  forma esperada.
  
  ## Breaking change
  
  Quem **implementa** `IGitService` precisa adicionar os cinco métodos novos. Quem
  apenas usa o `GitService` não muda nada — todas as adições são retrocompatíveis
  no uso.
  
  O `major` segue o mesmo critério do `pauseTask` em `ITaskManager`: o pacote está
  em 2.x, então quebra de contrato para implementadores é major. Se `IGitService`
  for considerado interno, isto pode virar `minor`.

### Patch Changes

- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [2f6d046]
  - @opentask/taskin-types@2.0.0

## 2.1.3

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1

## 2.1.2

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.1.0

## 2.1.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6

## 2.1.0

### Minor Changes

- Include all git authors and registry users in team metrics
  - Team metrics now aggregate all git committers in the period
  - Include all registered Taskin users even if they have no tasks
  - Fix git command execution issues with quoted parameters
  - Accept abbreviated git hashes (6-40 chars)
  - Increase git command timeout to 30s

## 2.0.3

### Patch Changes

- fix: publish missing packages with incremented versions

## 2.0.2

### Patch Changes

- fix: replace workspace:\* dependencies with actual npm versions

## 2.0.1

### Patch Changes

- chore: publish packages required by taskin CLI

## 2.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.
