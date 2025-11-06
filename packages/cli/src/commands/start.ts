/**
 * Start command - Begin working on a task
 */

import { FileSystemTaskProvider } from '@taskin/fs-task-provider';
import { TaskManager } from '@taskin/task-manager';
import type { Command } from 'commander';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';

interface StartOptions {
  base?: string;
  force?: boolean;
}

export function startCommand(program: Command): void {
  program
    .command('start <task-id>')
    .alias('begin')
    .description('🚀 Start working on a task')
    .option('-f, --force', 'Force start even with uncommitted changes')
    .option(
      '-b, --base <branch>',
      'Base branch to create from (default: current)',
    )
    .action(async (taskId: string, options: StartOptions) => {
      try {
        await startTask(taskId, options);
      } catch (err) {
        error(
          `Failed to start task: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}

async function startTask(
  taskId: string,
  _options: StartOptions,
): Promise<void> {
  printHeader(`Starting Task ${taskId}`, '🚀');

  // Normalize task ID
  const normalizedId = taskId.replace(/^task-/, '').padStart(3, '0');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize task manager
  const taskProvider = new FileSystemTaskProvider(tasksDir);
  const taskManager = new TaskManager(taskProvider);

  // Find task
  const task = await taskProvider.findTask(normalizedId);

  if (!task) {
    error(`Task ${normalizedId} not found in TASKS/ directory`);
    process.exit(1);
  }

  info(`Found task: ${task.title}`);
  info(`Current status: ${task.status}`);

  // Check if task is already in progress
  if (task.status === 'in-progress') {
    error('Task is already in progress');
    process.exit(1);
  }

  // Check if task is done
  if (task.status === 'done') {
    error('Task is already done');
    process.exit(1);
  }

  // Start the task
  info('Starting task...');
  const updatedTask = await taskManager.startTask(task.id);

  success(`Task ${updatedTask.id} started successfully!`);
  success(`Status changed to: ${updatedTask.status}`);
  console.log();
  info('Next steps:');
  console.log(
    colors.secondary(
      '  1. Create a branch: git checkout -b feat/task-' + normalizedId,
    ),
  );
  console.log(colors.secondary('  2. Start coding! 💻'));
  console.log(colors.secondary('  3. Use "taskin pause" to save progress'));
  console.log();
}
