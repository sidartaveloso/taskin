# @opentask/taskin-task-provider-pinia

## 2.0.1

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.

- Updated dependencies
  - @opentask/taskin-types@1.1.1
  - @opentask/taskin-task-manager@2.0.1

## 1.0.5

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.1.0
  - @opentask/taskin-types@1.1.0

## 1.0.4

### Patch Changes

- Updated dependencies
  - @opentask/taskin-types@1.0.6
  - @opentask/taskin-task-manager@1.0.9

## 1.0.3

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.8

## 1.0.2

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.7

## 1.0.1

### Patch Changes

- Updated dependencies
  - @opentask/taskin-task-manager@1.0.6

## 1.0.0

### Major Changes

- Implement track record system with Git-based metrics for user and team productivity analysis. Track commits, tasks completed, code impact, temporal patterns, and generate detailed statistics reports via CLI.
