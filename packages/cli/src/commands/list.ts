/**
 * List command - Display all tasks
 */

import { FileSystemTaskProvider } from '@taskin/fs-task-provider';
import type { TaskStatus, TaskType } from '@taskin/types-ts';
import type { Command } from 'commander';
import path from 'path';
import { colors, error, printHeader } from '../lib/colors.js';

interface ListOptions {
  status?: TaskStatus;
  type?: TaskType;
  user?: string;
}

export function listCommand(program: Command): void {
  program
    .command('list [filter]')
    .alias('ls')
    .description('📊 List all tasks in the project')
    .option(
      '-s, --status <status>',
      'Filter by status (pending, in-progress, done, blocked)',
    )
    .option(
      '-t, --type <type>',
      'Filter by type (feat, fix, refactor, docs, test, chore)',
    )
    .option('-u, --user <user>', 'Filter by user')
    .action(async (filter: string | undefined, options: ListOptions) => {
      try {
        await listTasks(filter, options);
      } catch (err) {
        error(
          `Failed to list tasks: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}

async function listTasks(
  filter: string | undefined,
  options: ListOptions,
): Promise<void> {
  printHeader('Task List', '📊');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize task provider
  const taskProvider = new FileSystemTaskProvider(tasksDir);

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

  if (options.user) {
    filteredTasks = filteredTasks.filter((t) =>
      t.userId?.toLowerCase().includes(options.user!.toLowerCase()),
    );
  }

  if (filter) {
    const lowerFilter = filter.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.id.includes(lowerFilter) ||
        t.title.toLowerCase().includes(lowerFilter) ||
        t.status.toLowerCase().includes(lowerFilter) ||
        t.userId?.toLowerCase().includes(lowerFilter),
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
      `${colors.info(task.id.padEnd(15))} ${statusColor(task.status.padEnd(15))} ${typeColor(task.type.padEnd(12))} ${colors.secondary((task.userId || 'unknown').padEnd(15))} ${colors.normal(task.title)}`,
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
