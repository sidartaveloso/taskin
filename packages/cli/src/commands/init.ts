/**
 * Init command - Initialize Taskin in the current project
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import { join } from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import {
  ensureProviderInstalled,
  isProviderInstalled,
} from '../lib/provider-installer/index.js';
import {
  getAllProviders,
  getProviderById,
  type ProviderInfo,
} from '../lib/provider-registry/index.js';
import { defineCommand } from './define-command/index.js';

interface InitOptions {
  force?: boolean;
}

export const initCommand = defineCommand({
  name: 'init',
  alias: 'setup',
  description: '🎯 Initialize Taskin in your project',
  options: [
    {
      flags: '-f, --force',
      description: 'Force initialization (overwrite existing configuration)',
    },
  ],
  handler: async (options: InitOptions) => {
    await initializeTaskin(options);
  },
});

async function initializeTaskin(options: InitOptions): Promise<void> {
  printHeader('Initializing Taskin', '🎯');

  const cwd = process.cwd();
  const configFile = join(cwd, '.taskin.json');

  // Check if already initialized
  if (existsSync(configFile) && !options.force) {
    error('Taskin is already initialized in this project');
    info('Use --force to reinitialize');
    process.exit(1);
  }

  // Get all providers from registry
  const allProviders = getAllProviders();

  // Create choices for inquirer
  const choices = allProviders.map((p) => {
    const installed = isProviderInstalled(p.packageName);
    const status = p.status === 'coming-soon' ? ' (coming soon)' : '';
    const installedMark = installed ? ' ✓' : '';

    return {
      name: `${p.name}${installedMark}${status} - ${p.description}`,
      value: p.id,
      disabled: p.status === 'coming-soon' ? 'Not yet implemented' : false,
    };
  });

  // Ask user to select provider
  const { providerId } = await inquirer.prompt<{ providerId: string }>([
    {
      type: 'list',
      name: 'providerId',
      message: 'Select a task provider:',
      choices,
      default: 'fs',
    },
  ]);

  const selectedProvider = getProviderById(providerId);
  if (!selectedProvider) {
    error(`Provider "${providerId}" not found`);
    process.exit(1);
  }

  console.log();
  info(`Setting up task provider: ${colors.highlight(selectedProvider.name)}`);
  console.log();

  // Ensure provider is installed (skip for bundled providers)
  const bundledProviders = ['fs']; // FileSystem provider is bundled in CLI
  if (!bundledProviders.includes(selectedProvider.id)) {
    await ensureProviderInstalled(selectedProvider);
  }

  // Setup provider configuration
  const providerConfig = await setupProviderConfig(selectedProvider, cwd);

  // Create .taskin.json configuration
  const config = {
    version: '0.1.0',
    provider: {
      type: selectedProvider.id,
      config: providerConfig,
    },
  };

  info('Creating configuration file...');
  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  success(`✓ Created ${colors.highlight('.taskin.json')}`);

  // Add .taskin.json to .gitignore if it exists
  const gitignorePath = join(cwd, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = require('fs').readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('.taskin.json')) {
      info('Adding .taskin.json to .gitignore...');
      writeFileSync(
        gitignorePath,
        `${gitignoreContent}\n# Taskin configuration\n.taskin.json\n`,
        'utf-8',
      );
      success('✓ Updated .gitignore');
    }
  }

  console.log();
  success('🎉 Taskin initialized successfully!');
  console.log();
  info('Next steps:');
  console.log(colors.secondary('  1. Run: taskin list'));
  console.log(
    colors.secondary(
      selectedProvider.id === 'fs'
        ? '  2. Edit or create tasks in TASKS/'
        : `  2. Tasks will be synced with ${selectedProvider.name}`,
    ),
  );
  console.log(colors.secondary('  3. Start working: taskin start <task-id>'));
  console.log();
  info('For more information, run: taskin --help');
  console.log();
}

/**
 * Setup provider configuration based on provider schema
 */
async function setupProviderConfig(
  provider: ProviderInfo,
  cwd: string,
): Promise<Record<string, unknown>> {
  // Special handling for File System provider
  if (provider.id === 'fs') {
    return setupFileSystemProvider(cwd);
  }

  // Generic configuration for other providers
  info(`Configuring ${provider.name}...`);
  console.log();

  const questions = Object.entries(provider.configSchema.properties).map(
    ([key, schema]) => ({
      type: schema.secret ? ('password' as const) : ('input' as const),
      name: key,
      message: `${schema.description}:`,
      validate: (input: string) => {
        if (
          provider.configSchema.required.includes(key) &&
          input.length === 0
        ) {
          return `${schema.description} is required`;
        }
        return true;
      },
    }),
  );

  const answers = await inquirer.prompt(questions);

  console.log();
  success(`✓ ${provider.name} configuration saved`);

  return answers;
}

async function setupFileSystemProvider(
  cwd: string,
): Promise<Record<string, string>> {
  const tasksDir = join(cwd, 'TASKS');

  // Create TASKS directory
  if (!existsSync(tasksDir)) {
    info(`Creating TASKS directory...`);
    mkdirSync(tasksDir, { recursive: true });
    success(`✓ Created ${colors.highlight('TASKS/')} directory`);
  } else {
    info(`${colors.highlight('TASKS/')} directory already exists`);
  }

  // Create a sample task
  const sampleTaskFile = join(tasksDir, 'task-001-setup-project.md');
  if (!existsSync(sampleTaskFile)) {
    info('Creating sample task...');
    const sampleTask = `# Task 001 — Setup Project

Status: pending
Type: chore
Assignee: developer

## Description

This is a sample task created during Taskin initialization.

## Tasks

- [ ] Review Taskin documentation
- [ ] Create your first task
- [ ] Start working on a task

## Notes

You can edit or delete this file. Use \`taskin list\` to see all tasks.
`;
    writeFileSync(sampleTaskFile, sampleTask, 'utf-8');
    success(
      `✓ Created sample task ${colors.highlight('task-001-setup-project.md')}`,
    );
  }

  return {
    tasksDir: 'TASKS',
  };
}
