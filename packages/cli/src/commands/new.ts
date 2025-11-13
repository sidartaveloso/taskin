/**
 * New command - Create a new task
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-fs-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import type { TaskType } from '@opentask/taskin-types';
import { existsSync, mkdirSync } from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
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

async function createTask(options: CreateTaskOptions): Promise<void> {
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
    error(
      `Invalid task type: ${options.type}. Must be one of: ${validTypes.join(', ')}`,
    );
    return;
  }

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Create TASKS directory if it doesn't exist
  if (!existsSync(tasksDir)) {
    mkdirSync(tasksDir, { recursive: true });
  }

  // Initialize user registry, task provider, and task manager
  const userRegistry = new UserRegistry({
    taskinDir: path.join(process.cwd(), '.taskin'),
  });

  try {
    // load registry if present (optional)
    await userRegistry.load();
  } catch {
    // ignore load errors for interactive creation
  }

  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);
  const taskManager = new TaskManager(taskProvider);

  // Create task using TaskManager
  try {
    const result = await taskManager.createTask({
      title: options.title,
      type: options.type as TaskType,
      description: options.description,
      assignee: options.user,
    });

    // Show success message
    console.log();
    success(`Task ${result.taskId} created successfully!`);
    console.log(colors.secondary(`📄 File: ${path.basename(result.filePath)}`));
    console.log(colors.secondary(`📁 Path: ${result.filePath}`));
    console.log();
    console.log(colors.info('Next steps:'));
    console.log(colors.normal(`  1. Edit the task file to add more details`));
    console.log(
      colors.normal(
        `  2. Run ${colors.highlight('taskin start ' + result.taskId)} to begin working on it`,
      ),
    );
    console.log();
  } catch (err) {
    error(
      `Failed to create task: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
