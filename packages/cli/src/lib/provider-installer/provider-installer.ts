/**
 * Provider installer
 * Detects, installs, and loads task providers dynamically
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { ProviderInfo } from '../provider-registry/provider-registry.types.js';
import type { PackageManager } from './provider-installer.types.js';

/**
 * Detect which package manager is being used
 */
export function detectPackageManager(): PackageManager {
  // Check for lock files
  if (existsSync('pnpm-lock.yaml')) {
    return 'pnpm';
  }
  if (existsSync('yarn.lock')) {
    return 'yarn';
  }
  // Default to npm
  return 'npm';
}

/**
 * Check if provider is bundled in the CLI
 */
function isBundledProvider(packageName: string): boolean {
  const bundledProviders = [
    '@opentask/taskin-fs-provider',
    '@opentask/taskin-core',
    '@opentask/taskin-task-manager',
    '@opentask/taskin-git-utils',
    '@opentask/taskin-utils',
  ];
  return bundledProviders.includes(packageName);
}

/**
 * Check if a provider package is installed
 */
export function isProviderInstalled(packageName: string): boolean {
  // Bundled providers are always "installed"
  if (isBundledProvider(packageName)) {
    return true;
  }

  try {
    // Try to resolve the package
    require.resolve(packageName);
    return true;
  } catch {
    // Package not found
    return false;
  }
}

/**
 * Install a provider package
 */
export function installProvider(provider: ProviderInfo): void {
  const packageManager = detectPackageManager();
  const { packageName } = provider;

  console.log(`\n📦 Installing ${packageName}...`);

  try {
    let command: string;
    switch (packageManager) {
      case 'pnpm':
        command = `pnpm add ${packageName}`;
        break;
      case 'yarn':
        command = `yarn add ${packageName}`;
        break;
      default:
        command = `npm install ${packageName}`;
    }

    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${packageName} installed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ Failed to install ${packageName}`);
    throw error;
  }
}

/**
 * Load a provider dynamically
 */
export async function loadProvider(packageName: string): Promise<unknown> {
  try {
    // Dynamic import for ESM compatibility
    const module = await import(packageName);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load provider: ${packageName}`);
    throw error;
  }
}

/**
 * Ensure provider is installed and load it
 */
export async function ensureProviderInstalled(
  provider: ProviderInfo,
): Promise<unknown> {
  const { packageName } = provider;

  // Check if already installed
  if (!isProviderInstalled(packageName)) {
    console.log(`\n⚠️  Provider ${packageName} is not installed.`);
    installProvider(provider);
  }

  // Load the provider
  return loadProvider(packageName);
}
