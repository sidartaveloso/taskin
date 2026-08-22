/**
 * New command - Create a new task
 */

import {
  FileSystemTaskProvider,
  pushAfterCreate,
  syncBeforeCreate,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { GitService, type IGitService } from '@opentask/taskin-git-utils';
import { slugify } from '@opentask/taskin-utils';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { colors, error, info, printHeader, success, warning } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface CreateTaskOptions {
  type?: string;
  title?: string;
  description?: string;
  user?: string;
}

export const createCommand = defineCommand({
  name: 'new',
  description: '➕ Create a new task',
  alias: 'create',
  options: [
    {
      flags: '-t, --type <type>',
      description: 'Task type (feat, fix, refactor, docs, test, chore)',
    },
    {
      flags: '-T, --title <title>',
      description: 'Task title',
    },
    {
      flags: '-d, --description <description>',
      description: 'Task description',
    },
    {
      flags: '-u, --user <user>',
      description: 'Assignee user',
    },
  ],
  handler: async (options: CreateTaskOptions) => {
    await createTask(options);
  },
});

export async function createTask(options: CreateTaskOptions, gitService?: IGitService): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader('Create New Task', '➕');

  // Validate task type values
  const validTypes = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore'];

  // If no options provided, enter interactive mode
  if (!options.type && !options.title) {
    info('Interactive mode - Answer the questions below:');
    console.log();

    const answers = await inquirer.prompt<{
      title: string;
      type: string;
      description?: string;
      user?: string;
    }>([
      {
        type: 'list',
        name: 'type',
        message: 'Select task type:',
        choices: [
          { name: '✨ feat - New feature', value: 'feat' },
          { name: '🐛 fix - Bug fix', value: 'fix' },
          { name: '♻️  refactor - Code refactoring', value: 'refactor' },
          { name: '📝 docs - Documentation', value: 'docs' },
          { name: '✅ test - Tests', value: 'test' },
          { name: '🔧 chore - Maintenance', value: 'chore' },
        ],
        default: 'feat',
      },
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        validate: (input: string) => {
          if (input.trim().length === 0) {
            return 'Title is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Task description (optional):',
      },
      {
        type: 'input',
        name: 'user',
        message: 'Assignee (optional):',
        default: 'A definir',
      },
    ]);

    // Merge answers into options
    options.type = answers.type;
    options.title = answers.title;
    options.description = answers.description;
    options.user = answers.user;

    console.log();
  }

  // Validate required options
  if (!options.type) {
    error('Task type is required. Use --type <type>');
    return;
  }

  if (!options.title) {
    error('Task title is required. Use --title <title>');
    return;
  }

  // Validate task type
  if (!validTypes.includes(options.type)) {
    error(`Invalid task type: ${options.type}. Must be one of: ${validTypes.join(', ')}`);
    return;
  }

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Create TASKS directory if it doesn't exist
  if (!existsSync(tasksDir)) {
    mkdirSync(tasksDir, { recursive: true });
  }

  // Initialize UserRegistry
  const monorepoRoot = path.dirname(tasksDir);
  const taskinDir = path.join(monorepoRoot, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });
  await userRegistry.load();

  // Ensure the current user exists in the registry
  await userRegistry.ensureCurrentUser();

  // Load automation config
  const configManager = new ConfigManager(monorepoRoot);
  const behavior = configManager.getAutomationBehavior();
  const autoSyncActive = behavior.autoSync && !!behavior.defaultBranch;

  if (behavior.autoSync && !behavior.defaultBranch) {
    warning('autoSync is enabled but no defaultBranch is configured. Nothing will be synced.');
  }

  // Initialize Git service
  const git = gitService ?? new GitService(process.cwd());

  // Sync with remote before numbering (fetch + rebase) when autoSync is active
  if (autoSyncActive) {
    try {
      await syncBeforeCreate(git, {
        autoSync: autoSyncActive,
        defaultBranch: behavior.defaultBranch,
      });
      info('Synced with remote before numbering.');
    } catch (syncError) {
      error(syncError instanceof Error ? `Sync failed: ${syncError.message}` : 'Sync failed. Aborting task creation.');
      return;
    }
  }

  // Initialize task provider to get existing tasks
  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);
  const allTasks = await taskProvider.getAllTasks();

  // Generate next task number
  const taskNumbers = allTasks
    .map((task) => {
      const match = task.id.match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => !Number.isNaN(num));

  const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
  const taskId = String(nextNumber).padStart(3, '0');

  // Create task file name
  const titleSlug = slugify(options.title);

  const fileName = `task-${taskId}-${titleSlug}.md`;
  const filePath = path.join(tasksDir, fileName);

  // Check if file already exists
  if (existsSync(filePath)) {
    error(`Task file already exists: ${fileName}`);
    return;
  }

  // Create task content
  const taskContent = generateTaskMarkdown({
    id: taskId,
    type: options.type,
    title: options.title,
    description: options.description || '',
    user: options.user || 'A definir',
  });

  // Write task file
  writeFileSync(filePath, taskContent, 'utf-8');

  // Commit and push the new task when autoSync is active
  if (autoSyncActive && behavior.defaultBranch) {
    try {
      await pushAfterCreate(git, {
        taskId,
        title: options.title,
        defaultBranch: behavior.defaultBranch,
      });
    } catch (pushError) {
      error(
        pushError instanceof Error
          ? `Push failed: ${pushError.message}`
          : 'Push failed. Task file was created but not pushed.',
      );
      return;
    }
  }

  // Show success message
  console.log();
  success(`Task ${taskId} created successfully!`);
  console.log(colors.secondary(`📄 File: ${fileName}`));
  console.log(colors.secondary(`📁 Path: ${filePath}`));
  if (autoSyncActive) {
    success('✓ Task committed and pushed to remote');
  }
  console.log();
  console.log(colors.info('Next steps:'));
  console.log(colors.normal(`  1. Edit the task file to add more details`));
  console.log(colors.normal(`  2. Run ${colors.highlight(`taskin start ${taskId}`)} to begin working on it`));
  console.log();
}

interface TaskData {
  description: string;
  id: string;
  title: string;
  type: string;
  user: string;
}

function generateTaskMarkdown(data: TaskData): string {
  return `# Task ${data.id} — ${data.title}

Status: pending
Type: ${data.type}
Assignee: ${data.user}

## Description

${data.description || 'Add task description here...'}

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes

Add any relevant notes or links here.
`;
}
