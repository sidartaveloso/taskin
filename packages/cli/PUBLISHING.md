# Publishing Guide

## Pre-publish Checklist

1. **Update version in package.json**

   ```bash
   cd packages/cli
   npm version patch  # or minor, or major
   ```

2. **Build the package**

   ```bash
   pnpm build
   ```

3. **Test locally**

   ```bash
   # Link globally
   npm link

   # Test commands
   taskin --help
   taskin init
   taskin list
   ```

4. **Run tests**

   ```bash
   pnpm test
   ```

5. **Check package contents**
   ```bash
   npm pack --dry-run
   ```

## Publishing to npm

### First time setup

```bash
# Login to npm
npm login
```

### Publish

```bash
cd packages/cli

# Dry run to see what will be published
npm publish --dry-run

# Publish
npm publish

# Or if you want to publish as beta/alpha
npm publish --tag beta
```

## After Publishing

1. **Test installation**

   ```bash
   npx taskin@latest init
   ```

2. **Update documentation**
   - Update version in README
   - Add release notes

3. **Create GitHub release**
   - Tag the release
   - Add changelog

## Testing with npx

```bash
# Test the published package
npx taskin init
npx taskin list
```

## Rollback

If something goes wrong:

```bash
# Unpublish within 72 hours
npm unpublish taskin@<version>

# Or deprecate
npm deprecate taskin@<version> "This version has issues, please use X.X.X"
```

## Package Configuration

Key fields in package.json for publishing:

- ✅ `name`: "taskin" (without @scope for global npm package)
- ✅ `version`: Semantic versioning
- ✅ `description`: Clear description
- ✅ `keywords`: Searchable terms
- ✅ `author`: Your info
- ✅ `license`: MIT
- ✅ `bin`: CLI entry point
- ✅ `files`: What to include in package
- ✅ `repository`: GitHub link
- ✅ `homepage`: Documentation link

## Dependencies

Dependencies will be bundled, but make sure to:

- Use `dependencies` for runtime deps
- Use `devDependencies` for build tools
- Keep the package size reasonable
