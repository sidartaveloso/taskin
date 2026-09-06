# @opentask/taskin-git-utils

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
