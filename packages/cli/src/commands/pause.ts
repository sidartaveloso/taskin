/**
 * Pause command - Pause work on a task
 */

import { FileSystemTaskProvider } from '@taskin/fs-task-provider';
import type { PauseTaskOptions } from '@taskin/types-ts';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { defineCommand } from './define-command/index.js';

export const pauseCommand = defineCommand({
  name: 'pause <task-id>',
  description: '⏸️  Pause work on a task',
  alias: 'stop',
  options: [
    {
      flags: '-m, --message <message>',
      description: 'Custom commit message',
    },
    {
      flags: '-s, --skip-commit',
      description: 'Skip commit (just show what would be done)',
    },
  ],
  handler: async (taskId: string, options: PauseTaskOptions) => {
    await pauseTask(taskId, options);
  },
});

async function pauseTask(
  taskId: string,
  options: PauseTaskOptions,
): Promise<void> {
  printHeader(`Pausing Task ${taskId}`, '⏸️');

  // Normalize task ID
  const normalizedId = taskId.replace(/^task-/, '').padStart(3, '0');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize task provider
  const taskProvider = new FileSystemTaskProvider(tasksDir);

  // Find task
  const task = await taskProvider.findTask(normalizedId);

  if (!task) {
    error(`Task ${normalizedId} not found in TASKS/ directory`);
    process.exit(1);
  }

  info(`Found task: ${task.title}`);
  info(`Current status: ${task.status}`);

  // Check if task is in progress
  if (task.status !== 'in-progress') {
    error('Task is not in progress. Use "taskin start" first.');
    process.exit(1);
  }

  const commitMessage =
    options.message || `WIP: task-${normalizedId} - ${task.title}`;

  if (options.skipCommit) {
    info('Would create commit with message:');
    console.log(colors.highlight(`  "${commitMessage}"`));
    console.log();
    info('Use without --skip-commit to actually commit');
  } else {
    info('Creating commit...');
    console.log(colors.secondary(`  Message: "${commitMessage}"`));
    console.log();
    success('Task paused successfully!');
    info('Commit created (not pushed)');
    console.log();
    info('Next steps:');
    console.log(colors.secondary('  1. Switch to another task'));
    console.log(
      colors.secondary('  2. Or continue later with the same branch'),
    );
  }

  console.log();
}
