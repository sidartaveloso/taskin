# Dev Scripts

Internal development tools and scripts for the Taskin monorepo.

> ⚠️ **Internal Use Only**: This package is not published to npm and contains tools used during development and CI/CD.

## 📦 Contents

### Scripts

- **`lint-manifests.ts`** - Validates package.json files across the monorepo
- **`lint-tasks.ts`** - Validates task markdown files format and structure

## 🚀 Usage

These scripts are typically run through the root package.json or CI/CD pipelines:

```bash
# From monorepo root
pnpm lint           # Runs ESLint + manifest/task validation

# Run specific scripts
pnpm --filter @opentask/taskin-dev run lint:manifests
pnpm --filter @opentask/taskin-dev run lint:tasks
```

## 🔧 Development

This package uses:
- **TypeScript** for type safety
- **Node.js** native APIs for file operations
- **Monorepo patterns** for cross-package validation

## 📝 Notes

- Scripts run in the context of the monorepo root
- Used for enforcing consistency across packages
- Not included in production builds or published packages

