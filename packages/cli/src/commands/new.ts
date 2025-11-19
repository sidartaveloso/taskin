/**
 * New command - Create a new task
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-fs-provider';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
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

  // Initialize UserRegistry
  const monorepoRoot = path.dirname(tasksDir);
  const taskinDir = path.join(monorepoRoot, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });
  await userRegistry.load();

  // Initialize task provider to get existing tasks
  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);
  const allTasks = await taskProvider.getAllTasks();

  // Generate next task number
  const taskNumbers = allTasks
    .map((task) => {
      const match = task.id.match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => !isNaN(num));

  const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
  const taskId = String(nextNumber).padStart(3, '0');

  // Create task file name
  const titleSlug = options.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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

  // Show success message
  console.log();
  success(`Task ${taskId} created successfully!`);
  console.log(colors.secondary(`📄 File: ${fileName}`));
  console.log(colors.secondary(`📁 Path: ${filePath}`));
  console.log();
  console.log(colors.info('Next steps:'));
  console.log(colors.normal(`  1. Edit the task file to add more details`));
  console.log(
    colors.normal(
      `  2. Run ${colors.highlight('taskin start ' + taskId)} to begin working on it`,
    ),
  );
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
