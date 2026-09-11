# GitHub Actions Workflows

## Storybook Deployment

### `storybook-deploy.yml`

Automatically builds and deploys the `@opentask/taskin-design-vue` Storybook to GitHub Pages.

#### Triggers

- **Push to `main`**: Deploys production version
- **Push to `develop`**: Deploys beta version
- **Manual dispatch**: Can be triggered manually from GitHub Actions UI

#### Features

- ✅ Builds Storybook from `packages/design-vue`
- ✅ Adds version badge (production/beta + commit hash)
- ✅ Caches pnpm dependencies for faster builds
- ✅ Deploys to GitHub Pages with proper permissions
- ✅ Only runs when design-vue files change

#### Setup Required

1. Enable GitHub Pages in repository settings:
   - Go to **Settings** → **Pages**
   - Source: **GitHub Actions**

2. Ensure workflow has proper permissions:
   - **Settings** → **Actions** → **General**
   - Workflow permissions: **Read and write permissions**

#### Output

- **Production**: `https://sidartaveloso.github.io/taskin/` (from `main` branch)
- **Beta**: `https://sidartaveloso.github.io/taskin/beta/` (from `develop` branch)

> **Note**: Beta deploys to `/beta/` subdirectory, production deploys to root. Both versions coexist without overwriting each other.

#### Local Testing

Test the Storybook build locally before pushing:

```bash
pnpm run build:storybook
pnpm dlx serve storybook-static
```

The gallery published at `/components/` is the **root** Storybook, which covers
`design-vue` and `ui-sense` in a single tree. Building only one package
(`pnpm --filter @opentask/taskin-design-vue run build:storybook`) still works and
is useful when iterating on that package alone, but it is not what ships.
