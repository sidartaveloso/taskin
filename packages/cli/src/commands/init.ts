/**
 * Init command - Initialize Taskin in the current project
 */

import { CI_SKIP_TAGS, DEFAULT_CI_SKIP_TAG } from '@opentask/taskin-git-utils';
import type { User } from '@opentask/taskin-types';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import { join } from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { ensureProviderInstalled, isProviderInstalled } from '../lib/provider-installer/index.js';
import { getAllProviders, getProviderById, type ProviderInfo } from '../lib/provider-registry/index.js';
import { defineCommand } from './define-command/index.js';

interface InitOptions {
  force?: boolean;
  provider?: string;
  ciSkipTag?: string;
}

/** The word a user types to mean "append no tag at all". */
const NO_CI_SKIP_TAG_KEYWORD = 'none';

export const initCommand = defineCommand({
  name: 'init',
  alias: 'setup',
  description: '🎯 Initialize Taskin in your project',
  options: [
    {
      flags: '-f, --force',
      description: 'Force initialization (overwrite existing configuration)',
    },
    {
      flags: '-p, --provider <provider>',
      description: 'Provider to use (fs, redmine, jira, github) - skips interactive prompt',
    },
    {
      flags: '--ci-skip-tag <tag>',
      description: `Tag appended to Taskin's own commits so they skip CI (default "${DEFAULT_CI_SKIP_TAG}"; "none" to run CI) - skips interactive prompt`,
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

  // Ask user to select provider (or use provided option)
  let providerId: string;

  if (options.provider) {
    // Use provider from command line option
    providerId = options.provider;
    info(`Using provider from command line: ${colors.highlight(providerId)}`);
  } else if (process.env.CI === 'true') {
    // In CI environment, default to fs provider
    providerId = 'fs';
    info('CI environment detected, using default provider: fs');
  } else {
    // Interactive prompt
    const response = await inquirer.prompt<{ providerId: string }>([
      {
        type: 'list',
        name: 'providerId',
        message: 'Select a task provider:',
        choices,
        default: 'fs',
      },
    ]);
    providerId = response.providerId;
  }

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

  const ciSkipTag = await resolveCiSkipTag(options.ciSkipTag);

  // Create .taskin.json configuration
  //
  // The automation block is written out in full rather than left to the
  // schema's defaults: a tag that decides whether every status commit runs the
  // project's pipeline should be visible in the file, not implied by it.
  const config = {
    version: '1.0.3',
    automation: {
      level: 'assisted',
      autoSync: true,
      ciSkipTag,
    },
    provider: {
      type: selectedProvider.id,
      config: providerConfig,
    },
  };

  info('Creating configuration file...');
  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  success(`✓ Created ${colors.highlight('.taskin.json')}`);

  // Propose creating first user
  if (process.env.CI !== 'true' && selectedProvider.id === 'fs') {
    await promptCreateFirstUser(cwd);
  }

  //TODO: execute provider.initialize()

  console.log();
  success('🎉 Taskin initialized successfully!');
  console.log();
  info('Next steps:');
  console.log(colors.secondary('  1. Run: taskin list'));
  console.log(
    colors.secondary(
      selectedProvider.id === 'fs'
        ? '  2. Create a new task: taskin new (interactive mode)'
        : `  2. Tasks will be synced with ${selectedProvider.name}`,
    ),
  );
  console.log(colors.secondary('  3. Start working: taskin start <task-id>'));
  console.log();
  info('For more information, run: taskin --help');
  console.log();
}

/**
 * Decides the tag Taskin appends to the commits it writes on its own.
 *
 * A tag on the command line wins; in CI there is nobody to ask, so the default
 * stands; otherwise the user picks one.
 */
async function resolveCiSkipTag(fromFlag: string | undefined): Promise<string> {
  if (fromFlag !== undefined) {
    return normalizeCiSkipTag(fromFlag);
  }

  if (process.env.CI === 'true') {
    return DEFAULT_CI_SKIP_TAG;
  }

  console.log();
  info('Taskin appends a tag to the commits it writes itself — status changes and');
  info('task files — so they do not trigger your pipeline.');
  console.log();

  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'list',
      name: 'choice',
      message: 'Tag for Taskin commits:',
      default: DEFAULT_CI_SKIP_TAG,
      choices: [
        { name: `${CI_SKIP_TAGS[0]} — GitHub, GitLab and Bitbucket (recommended)`, value: CI_SKIP_TAGS[0] },
        { name: `${CI_SKIP_TAGS[1]} — GitHub, GitLab and Bitbucket`, value: CI_SKIP_TAGS[1] },
        { name: `${CI_SKIP_TAGS[2]} — GitHub Actions only`, value: CI_SKIP_TAGS[2] },
        { name: `${CI_SKIP_TAGS[3]} — GitHub Actions only`, value: CI_SKIP_TAGS[3] },
        { name: `${CI_SKIP_TAGS[4]} — GitHub Actions only`, value: CI_SKIP_TAGS[4] },
        { name: 'none — do not mark the commits, let CI run', value: NO_CI_SKIP_TAG_KEYWORD },
        { name: 'custom… — another CI (Azure DevOps uses ***NO_CI***)', value: 'custom' },
      ],
    },
  ]);

  if (choice !== 'custom') {
    return normalizeCiSkipTag(choice);
  }

  const { customTag } = await inquirer.prompt<{ customTag: string }>([
    {
      type: 'input',
      name: 'customTag',
      message: 'Tag to append:',
      default: DEFAULT_CI_SKIP_TAG,
    },
  ]);

  return normalizeCiSkipTag(customTag);
}

function normalizeCiSkipTag(input: string): string {
  const trimmed = input.trim();

  return trimmed.toLowerCase() === NO_CI_SKIP_TAG_KEYWORD ? '' : trimmed;
}

/**
 * Setup provider configuration based on provider schema
 */
async function setupProviderConfig(provider: ProviderInfo, cwd: string): Promise<Record<string, unknown>> {
  // Special handling for File System provider
  if (provider.id === 'fs') {
    return setupFileSystemProvider(cwd);
  }

  // Generic configuration for other providers
  info(`Configuring ${provider.name}...`);
  console.log();

  const questions = Object.entries(provider.configSchema.properties).map(([key, schema]) => ({
    type: schema.secret ? ('password' as const) : ('input' as const),
    name: key,
    message: `${schema.description}:`,
    validate: (input: string) => {
      if (provider.configSchema.required.includes(key) && input.length === 0) {
        return `${schema.description} is required`;
      }
      return true;
    },
  }));

  const answers = await inquirer.prompt(questions);

  console.log();
  success(`✓ ${provider.name} configuration saved`);

  return answers;
}

/*
 * O unico lugar que nomeia um provider concreto fora da factory, de proposito:
 * `init` roda ANTES de existir `.taskin.json`, e e ele quem escreve o
 * `provider.type`. A factory le essa configuracao, entao nao pode ser usada
 * aqui — seria circular.
 */
async function setupFileSystemProvider(cwd: string): Promise<Record<string, string>> {
  const tasksDir = join(cwd, 'TASKS');
  // Chama inicialização do provider
  const { DEFAULT_METADATA_STYLE_ID, FileSystemTaskProvider, getMetadataStyle, UserRegistry } = await import(
    '@opentask/taskin-file-system-provider'
  );

  const userRegistry = new UserRegistry({ taskinDir: join(cwd, '.taskin') });
  const fileSystemProvider = new FileSystemTaskProvider(tasksDir, userRegistry);
  await fileSystemProvider.initialize();

  // Check if any task-001-*.md file already exists
  const existingTask001 = readdirSync(tasksDir).find(
    (file: string) => file.startsWith('task-001-') && file.endsWith('.md'),
  );

  if (existingTask001) {
    info(`Sample task already exists: ${colors.highlight(existingTask001)}`);
    info('Skipping sample task creation (users already know the pattern)');
  } else {
    // Create a sample task
    const sampleTaskFile = join(tasksDir, 'task-001-setup-project.md');
    info('Creating sample task...');
    // A amostra sai no mesmo estilo que o provider vai escrever daqui em
    // diante: um arquivo de exemplo fora do padrao ensina o padrao errado.
    const sampleMetadata = getMetadataStyle(DEFAULT_METADATA_STYLE_ID).format([
      { label: 'Status', value: 'pending' },
      { label: 'Type', value: 'chore' },
      { label: 'Assignee', value: 'developer' },
    ]);

    const sampleTask = `# Task 001 — Setup Project

${sampleMetadata}

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
    success(`✓ Created sample task ${colors.highlight('task-001-setup-project.md')}`);
  }

  /*
   * O estilo vai escrito no `.taskin.json`, e nao deixado implicito: o valor
   * default muda entre versoes, e um projeto que nunca escolheu nao deveria
   * ver seus arquivos mudarem de marcacao num upgrade.
   */
  return {
    tasksDir: 'TASKS',
    metadataStyle: DEFAULT_METADATA_STYLE_ID,
  };
}

async function promptCreateFirstUser(cwd: string): Promise<void> {
  const { UserRegistry } = await import('@opentask/taskin-file-system-provider');
  const taskinDir = join(cwd, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });

  const { createFirstUser } = await inquirer.prompt<{
    createFirstUser: boolean;
  }>([
    {
      type: 'confirm',
      name: 'createFirstUser',
      message: 'Create the first user now?',
      default: true,
    },
  ]);

  if (!createFirstUser) {
    info('You can create users later with the registry commands.');
    return;
  }

  const answers = await inquirer.prompt<{ name: string; email: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Full name:',
      default: process.env.USER || 'developer',
      validate: (input: string) => input.trim().length > 0 || 'Name is required',
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: 'developer@example.com',
      validate: (input: string) => input.includes('@') || 'A valid email is required',
    },
  ]);

  const user: User = {
    id: answers.name.toLowerCase().replace(/\s+/g, '-'),
    name: answers.name,
    email: answers.email,
  };

  await userRegistry.saveUser(user);
  success(`✓ User "${user.name}" (${user.email}) created successfully!`);
}
