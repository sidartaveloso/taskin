# @opentask/taskin-git-utils

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
