# Publishing Taskin Packages

This directory contains scripts for publishing Taskin packages to npm.

## publish-packages.js

Automated script to publish both `taskin` and `@opentask/taskin` packages to npm.

### Usage

From the repository root:

```bash
# Publish with beta tag (default)
pnpm publish:beta

# Publish with latest tag
pnpm publish:latest

# Custom tag
pnpm publish:packages --tag alpha

# Skip confirmation prompt
pnpm publish:packages --yes
```

### What it does

1. **Type checks** - Runs `pnpm typecheck` on each package
2. **Builds** - Runs `pnpm build` on each package
3. **Dry run** - Tests publication without actually publishing
4. **Publishes** - Publishes to npm registry with specified tag
5. **Summary** - Shows which packages succeeded/failed

### Packages Published

1. `taskin` - Main CLI package (`packages/cli`)
2. `@opentask/taskin` - Alias package (`packages/taskin-alias`)

### Requirements

- Must be logged in to npm (`npm login`)
- Must have publish permissions for both packages
- All tests must pass
- Clean build output

### Examples

```bash
# Standard beta release
pnpm publish:beta

# Production release (requires manual confirmation)
pnpm publish:latest

# Test what would be published
cd packages/cli && npm publish --dry-run --tag beta
```
