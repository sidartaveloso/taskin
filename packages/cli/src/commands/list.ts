/**
 * list command - List all tasks in the project
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import type {
  ListTasksOptions,
  TaskStatus,
  TaskType,
} from '@opentask/taskin-types';
import path from 'path';
import { colors, printHeader } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

export const listCommand = defineCommand({
  name: 'list [filter]',
  description: '📊 List all tasks in the project',
  alias: 'ls',
  options: [
    {
      flags: '-s, --status <status>',
      description: 'Filter by status (pending, in-progress, done, blocked)',
    },
    {
      flags: '-t, --type <type>',
      description: 'Filter by type (feat, fix, refactor, docs, test, chore)',
    },
    {
      flags: '-u, --user <user>',
      description: 'Filter by user',
    },
  ],
  handler: async (filter: string | undefined, options: ListTasksOptions) => {
    await listTasks(filter, options);
  },
});

async function listTasks(
  filter: string | undefined,
  options: ListTasksOptions,
): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader('Task List', '📊');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize UserRegistry
  const monorepoRoot = path.dirname(tasksDir);
  const taskinDir = path.join(monorepoRoot, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });
  await userRegistry.load();

  // Initialize task provider
  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);

  // Get all tasks
  const tasks = await taskProvider.getAllTasks();

  if (tasks.length === 0) {
    console.log(colors.warning('No tasks found in TASKS/ directory'));
    return;
  }

  // Apply filters
  let filteredTasks = tasks;

  if (options.status) {
    filteredTasks = filteredTasks.filter((t) => t.status === options.status);
  }

  if (options.type) {
    filteredTasks = filteredTasks.filter((t) => t.type === options.type);
  }

  if (options.assignee) {
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.assignee?.name
          .toLowerCase()
          .includes(options.assignee!.toLowerCase()) ||
        t.assignee?.id.toLowerCase().includes(options.assignee!.toLowerCase()),
    );
  }

  if (filter) {
    const lowerFilter = filter.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.id.includes(lowerFilter) ||
        t.title.toLowerCase().includes(lowerFilter) ||
        t.status.toLowerCase().includes(lowerFilter) ||
        t.assignee?.name.toLowerCase().includes(lowerFilter) ||
        t.assignee?.id.toLowerCase().includes(lowerFilter),
    );
  }

  if (filteredTasks.length === 0) {
    console.log(colors.warning('No tasks match the filters'));
    return;
  }

  // Display tasks
  console.log(
    colors.highlight(
      `${'ID'.padEnd(15)} ${'Status'.padEnd(15)} ${'Type'.padEnd(12)} ${'User'.padEnd(15)} ${'Title'}`,
    ),
  );
  console.log(colors.secondary('─'.repeat(100)));

  filteredTasks.forEach((task) => {
    const statusColor = getStatusColor(task.status);
    const typeColor = getTypeColor(task.type);

    console.log(
      `${colors.info(task.id.padEnd(15))} ${statusColor(task.status.padEnd(15))} ${typeColor(task.type.padEnd(12))} ${colors.secondary((task.assignee?.name || 'unassigned').padEnd(15))} ${colors.normal(task.title)}`,
    );
  });

  console.log();
  console.log(colors.secondary('─'.repeat(100)));

  // Summary
  const statusCounts = {
    pending: filteredTasks.filter((t) => t.status === 'pending').length,
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress')
      .length,
    done: filteredTasks.filter((t) => t.status === 'done').length,
    blocked: filteredTasks.filter((t) => t.status === 'blocked').length,
  };

  console.log(
    colors.info(
      `📊 Total: ${filteredTasks.length} tasks | ⏳ Pending: ${statusCounts.pending} | 🚀 In Progress: ${statusCounts['in-progress']} | ✅ Done: ${statusCounts.done} | 🚫 Blocked: ${statusCounts.blocked}`,
    ),
  );
  console.log();
}

function getStatusColor(status: TaskStatus): (text: string) => string {
  switch (status) {
    case 'pending':
      return colors.secondary;
    case 'in-progress':
      return colors.info;
    case 'done':
      return colors.success;
    case 'blocked':
      return colors.error;
    default:
      return colors.normal;
  }
}

function getTypeColor(type: TaskType): (text: string) => string {
  switch (type) {
    case 'feat':
      return colors.success;
    case 'fix':
      return colors.error;
    case 'refactor':
      return colors.warning;
    case 'docs':
      return colors.info;
    case 'test':
      return colors.secondary;
    case 'chore':
      return colors.normal;
    default:
      return colors.normal;
  }
}
