# @opentask/taskin-file-system-provider

## 2.2.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-git-utils@2.1.1
  - @opentask/taskin-task-manager@1.0.9

## 2.2.0

### Minor Changes

- Normalização de acentos em nomes de arquivos (feat)Pacotes afetados: @opentask/taskin-utils, @opentask/taskin-file-system-provider, taskinImplementada função slugify() que remove acentos de títulos ao criar arquivos de tarefasExemplo: "Configuração inicial" → task-001-configuracao-inicial.mdTítulo original com acentos é preservado dentro do arquivo2. Supressão de sons durante testes (fix)Pacote afetado: taskinSons dos comandos start e finish agora são automaticamente suprimidos quando CI=true ou NODE_ENV=testTestes E2E executam mais rápido e sem interferências3. Correção de dependências workspace (fix)Pacotes afetados: @opentask/taskin-git-utils, @opentask/taskin-file-system-provider, @opentask/taskin-task-manager, taskinMudança de ^1.0.5 para workspace:\* nas dependências de @opentask/taskin-typesGarante uso da versão local durante desenvolvimento e resolução correta no publishTipo de release sugerido: minor (nova feature de normalização de acentos)

### Patch Changes

- Updated dependencies
  - @opentask/taskin-utils@1.1.0

## 2.1.0

### Minor Changes

- Include all git authors and registry users in team metrics
  - Team metrics now aggregate all git committers in the period
  - Include all registered Taskin users even if they have no tasks
  - Fix git command execution issues with quoted parameters
  - Accept abbreviated git hashes (6-40 chars)
  - Increase git command timeout to 30s

### Patch Changes

- Updated dependencies
  - @opentask/taskin-git-utils@2.1.0

## 2.0.3

### Patch Changes

- fix: publish missing packages with incremented versions
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.3
  - @opentask/taskin-task-manager@1.0.8

## 2.0.2

### Patch Changes

- fix: replace workspace:\* dependencies with actual npm versions
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.2
  - @opentask/taskin-task-manager@1.0.7

## 2.0.1

### Patch Changes

- chore: publish packages required by taskin CLI
- Updated dependencies
  - @opentask/taskin-git-utils@2.0.1
  - @opentask/taskin-task-manager@1.0.6

## 2.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.

### Patch Changes

- Updated dependencies
  - @opentask/taskin-git-utils@2.0.0
