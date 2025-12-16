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
- **Beta**: `https://sidartaveloso.github.io/taskin/` (from `develop` branch)

> **Note**: Both versions deploy to the same URL. The latest push to either `main` or `develop` will be live. For separate environments, consider using different repositories or subdirectories.

#### Local Testing

Test the Storybook build locally before pushing:

```bash
cd packages/design-vue
pnpm run build:storybook
pnpm dlx serve storybook-static
```
