# Task 008 — publish storybook to world

Status: done  
Type: feat  
Assignee: Sidarta Veloso

## Description

Automatize CI to build and publish design-vue storybook.
Must run after commit in develop (generating beta version and publish in a beta space).
Must run after commit in main (generationg production version ant publish in a latest production space).

## Implementation

✅ Created GitHub Actions workflow (`.github/workflows/storybook-deploy.yml`):

- Triggers on push to `main` (production) or `develop` (beta)
- Builds Storybook from `packages/design-vue`
- Adds version badge with commit hash
- Deploys to GitHub Pages

## Setup Instructions

1. Enable GitHub Pages:
   - Go to **Settings** → **Pages**
   - Source: **GitHub Actions**

2. Grant workflow permissions:
   - **Settings** → **Actions** → **General**
   - Workflow permissions: **Read and write permissions**

3. Push changes to trigger deployment

## Output URL

- **Production**: `https://sidartaveloso.github.io/taskin/` (from `main` branch)
- **Beta**: `https://sidartaveloso.github.io/taskin/beta/` (from `develop` branch)

## Notes

Beta version deploys to `/beta/` subdirectory, production deploys to root directory. Both versions coexist without overwriting each other.
