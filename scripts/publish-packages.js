#!/usr/bin/env node

/**
 * Script to publish Taskin packages to npm
 * Publishes both taskin and @opentask/taskin packages
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const colors = {
  blue: '\x1b[34m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, cwd) {
  log(`\n> ${command}`, colors.cyan);
  try {
    execSync(command, {
      cwd,
      env: { ...process.env },
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    log(`✗ Command failed: ${command}`, colors.red);
    return false;
  }
}

function getPackageVersion(packagePath) {
  const pkg = JSON.parse(
    readFileSync(join(packagePath, 'package.json'), 'utf-8'),
  );
  return { name: pkg.name, version: pkg.version };
}

async function publishPackage(packageName, packagePath, tag = 'latest') {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`📦 Publishing ${packageName}`, colors.bright);
  log('='.repeat(60), colors.bright);

  const { name, version } = getPackageVersion(packagePath);
  log(`Package: ${name}@${version}`, colors.blue);
  log(`Tag: ${tag}`, colors.blue);

  // Run tests if available
  log('\n📋 Running checks...', colors.yellow);
  exec('pnpm typecheck', packagePath);

  // Build the package
  log('\n🔨 Building package...', colors.yellow);
  if (!exec('pnpm build', packagePath)) {
    log(`✗ Build failed for ${name}`, colors.red);
    return false;
  }

  // Dry run first
  log('\n🧪 Dry run...', colors.yellow);
  if (
    !exec(`pnpm publish --tag ${tag} --dry-run --no-git-checks`, packagePath)
  ) {
    log(`✗ Dry run failed for ${name}`, colors.red);
    return false;
  }

  // Actual publish
  log('\n🚀 Publishing to npm...', colors.yellow);
  if (!exec(`pnpm publish --tag ${tag} --no-git-checks`, packagePath)) {
    log(`✗ Publish failed for ${name}`, colors.red);
    return false;
  }

  log(`\n✓ Successfully published ${name}@${version}`, colors.green);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const tag = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : 'beta';

  const skipConfirm = args.includes('--yes') || args.includes('-y');

  log('\n' + '='.repeat(60), colors.bright);
  log('🚀 Taskin Package Publisher', colors.bright);
  log('='.repeat(60), colors.bright);

  // Sync versions first
  log('\n🔄 Syncing package versions...', colors.yellow);
  if (!exec('node scripts/sync-versions.js', rootDir)) {
    log('✗ Failed to sync versions', colors.red);
    process.exit(1);
  }

  const packages = [
    {
      name: 'taskin (CLI)',
      path: join(rootDir, 'packages/cli'),
    },
    {
      name: '@opentask/taskin (Alias)',
      path: join(rootDir, 'packages/taskin-alias'),
    },
  ];

  // Show what will be published
  log('\n📦 Packages to publish:', colors.yellow);
  for (const pkg of packages) {
    const { name, version } = getPackageVersion(pkg.path);
    log(`  • ${name}@${version} [tag: ${tag}]`, colors.blue);
  }

  if (!skipConfirm) {
    log(
      '\n⚠️  Press Ctrl+C to cancel, or press Enter to continue...',
      colors.yellow,
    );
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });
  }

  // Publish packages
  const results = [];
  for (const pkg of packages) {
    const success = await publishPackage(pkg.name, pkg.path, tag);
    results.push({ ...pkg, success });
  }

  // Summary
  log('\n' + '='.repeat(60), colors.bright);
  log('📊 Publication Summary', colors.bright);
  log('='.repeat(60), colors.bright);

  for (const result of results) {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    const { name, version } = getPackageVersion(result.path);
    log(`${icon} ${name}@${version}`, color);
  }

  const allSuccess = results.every((r) => r.success);
  if (allSuccess) {
    log('\n🎉 All packages published successfully!', colors.green);
    log('\nTest installation:', colors.cyan);
    log(`  npx taskin@${tag} --version`, colors.blue);
    log(`  npx @opentask/taskin@${tag} --version`, colors.blue);
  } else {
    log('\n⚠️  Some packages failed to publish', colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n✗ Error: ${error.message}`, colors.red);
  process.exit(1);
});
