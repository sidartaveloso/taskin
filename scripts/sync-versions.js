#!/usr/bin/env node

/**
 * Script to sync versions between taskin and @opentask/taskin packages
 * Ensures the alias package always depends on the exact same version as the main CLI
 */

import { readFileSync, writeFileSync } from 'fs';
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
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  // eslint-disable-next-line no-console
  console.log(`${color}${message}${colors.reset}`);
}

function syncVersions() {
  log('\n🔄 Syncing package versions...', colors.bright);

  // Read main CLI package.json
  const cliPath = join(rootDir, 'packages/cli/package.json');
  const cliPkg = JSON.parse(readFileSync(cliPath, 'utf-8'));
  const version = cliPkg.version;

  log(`📦 Main package version: ${cliPkg.name}@${version}`, colors.blue);

  // Update alias package.json
  const aliasPath = join(rootDir, 'packages/taskin-alias/package.json');
  const aliasPkg = JSON.parse(readFileSync(aliasPath, 'utf-8'));

  const oldVersion = aliasPkg.version;
  const oldDep = aliasPkg.dependencies?.taskin;
  const oldPeerDep = aliasPkg.peerDependencies?.taskin;

  // Update versions
  aliasPkg.version = version;
  if (aliasPkg.dependencies?.taskin) {
    aliasPkg.dependencies.taskin = version;
  }
  if (aliasPkg.peerDependencies?.taskin) {
    aliasPkg.peerDependencies.taskin = `^${version}`;
  }

  // Write back
  writeFileSync(aliasPath, JSON.stringify(aliasPkg, null, 2) + '\n', 'utf-8');

  log(`\n✅ Synced ${aliasPkg.name}:`, colors.green);
  log(`   Version: ${oldVersion} → ${version}`, colors.cyan);
  if (oldDep !== version) {
    log(`   Dependency: ${oldDep} → ${version}`, colors.cyan);
  }
  if (oldPeerDep !== `^${version}`) {
    log(`   Peer Dependency: ${oldPeerDep} → ^${version}`, colors.cyan);
  }

  log('\n✨ Version sync complete!', colors.green);
}

try {
  syncVersions();
} catch (error) {
  console.error('\n❌ Error syncing versions:', error.message);
  process.exit(1);
}
