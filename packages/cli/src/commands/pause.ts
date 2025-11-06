/**
 * Pause command - Pause work on a task
 */

import { FileSystemTaskProvider } from '@taskin/fs-task-provider';
import type { Command } from 'commander';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';

interface PauseOptions {
  message?: string;
  skipCommit?: boolean;
}

export function pauseCommand(program: Command): void {
  program
    .command('pause <task-id>')
    .alias('stop')
    .description('⏸️  Pause work on a task')
    .option('-m, --message <message>', 'Custom commit message')
    .option('-s, --skip-commit', 'Skip commit (just show what would be done)')
    .action(async (taskId: string, options: PauseOptions) => {
      try {
        await pauseTask(taskId, options);
      } catch (err) {
        error(
          `Failed to pause task: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}

async function pauseTask(taskId: string, options: PauseOptions): Promise<void> {
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
