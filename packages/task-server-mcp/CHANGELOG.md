# @opentask/taskin-task-server-mcp

## 0.1.9

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-task-manager@2.0.1
  - @opentask/taskin-file-system-provider@3.0.2

## 0.1.8

### Patch Changes

- feat(cli): implement review command with unified hook system

  Add new `taskin review` command to prepare tasks for code review with automated quality checks.

  **New Features:**
  - Add `review` command to transition tasks from in-progress to in-review status
  - Implement unified hook system supporting pre/during/post phases for all commands
  - Add config-manager for .taskin.json hook configuration
  - Add reviewTask() method to TaskManager
  - Add comprehensive TypeScript schemas and types for hooks and configuration

  **UX Improvements:**
  - Standardize --open flag semantics across list and dashboard commands
  - Add --browser/-b flag for launching browser in dashboard
  - Remove redundant --filter-open and --filter-closed flags

  **Build Fixes:**
  - Add composite:true to CLI tsconfig for project references
  - Add @modelcontextprotocol/sdk as direct dependency
  - Fix VS Code TypeScript Language Server cache issues

  **BREAKING CHANGE:**

  The `--open` flag in `taskin dashboard` now filters open tasks (consistent with list command) instead of opening a browser. Use the new `--browser` or `-b` flag to open the browser automatically.

  **New Files:**
  - packages/cli/src/commands/review.ts (321 lines)
  - packages/cli/src/lib/hook-runner.ts (119 lines)
  - packages/cli/src/lib/hook-runner.test.ts (242 lines)
  - packages/cli/src/lib/config-manager.ts (46 lines)
  - packages/types-ts/src/taskin.schemas.ts (+137 lines)
  - packages/types-ts/src/taskin.types.ts (+108 lines)

  Closes #014

- Updated dependencies [9e3e2e4]
- Updated dependencies [9e3e2e4]
- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.2
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0

## 0.1.7

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-file-system-provider@2.2.1
  - @opentask/taskin-task-manager@1.0.9

## 0.1.6

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.2.0

## 0.1.5

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.1.0

## 0.1.4

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.3
  - @opentask/taskin-task-manager@1.0.8

## 0.1.3

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.2
  - @opentask/taskin-task-manager@1.0.7

## 0.1.2

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.1
  - @opentask/taskin-task-manager@1.0.6

## 0.1.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-file-system-provider@2.0.0
