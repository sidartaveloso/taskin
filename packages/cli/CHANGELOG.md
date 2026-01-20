# taskin

## 2.2.1

### Patch Changes

- fix(cli): correct TaskinConfigSchema import to resolve runtime error

  Change from namespace import pattern to direct named import to prevent
  undefined schema error when running config command in production.

## 2.2.0

### Minor Changes

- feat(cli): add config command for automation settings

  Implement `taskin config` command to manage automation levels through CLI.

  **Features:**
  - `taskin config --show` - Display current configuration
  - `taskin config --level <manual|assisted|autopilot>` - Set automation level
  - `taskin config` - Interactive mode with menu selection
  - Input validation and error handling
  - 10 unit tests with full coverage

  **Automation Levels:**
  - `manual` - All commits are suggestions only
  - `assisted` - Auto-commit status changes and pauses (default)
  - `autopilot` - Auto-commit everything

  Closes task-013

## 2.1.0

### Minor Changes

- Normalização de acentos em nomes de arquivos (feat)Pacotes afetados: @opentask/taskin-utils, @opentask/taskin-file-system-provider, taskinImplementada função slugify() que remove acentos de títulos ao criar arquivos de tarefasExemplo: "Configuração inicial" → task-001-configuracao-inicial.mdTítulo original com acentos é preservado dentro do arquivo2. Supressão de sons durante testes (fix)Pacote afetado: taskinSons dos comandos start e finish agora são automaticamente suprimidos quando CI=true ou NODE_ENV=testTestes E2E executam mais rápido e sem interferências3. Correção de dependências workspace (fix)Pacotes afetados: @opentask/taskin-git-utils, @opentask/taskin-file-system-provider, @opentask/taskin-task-manager, taskinMudança de ^1.0.5 para workspace:\* nas dependências de @opentask/taskin-typesGarante uso da versão local durante desenvolvimento e resolução correta no publishTipo de release sugerido: minor (nova feature de normalização de acentos)

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.0
  - @opentask/taskin-utils@1.1.0
  - @opentask/taskin-task-server-mcp@0.1.6

## 2.0.4

### Patch Changes

- Update dependencies to include enhanced team metrics
  - Bump @opentask/taskin-file-system-provider to ^2.1.0
  - Bump @opentask/taskin-git-utils to ^2.1.0
  - Team stats now include all git committers and registry users

## 2.0.3

### Patch Changes

- fix: publish missing packages with incremented versions
- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.3
  - @opentask/taskin-git-utils@2.0.3
  - @opentask/taskin-task-manager@1.0.8
  - @opentask/taskin-task-server-mcp@0.1.4
  - @opentask/taskin-task-server-ws@0.1.3

## 2.0.2

### Patch Changes

- fix: update internal dependencies to latest published versions

## 2.0.1

### Patch Changes

- fix: move internal dependencies from devDependencies to dependencies to ensure they are installed when the package is used

## 2.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.
