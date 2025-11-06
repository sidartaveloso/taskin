/**
 * Finish command - Complete a task
 */

import { FileSystemTaskProvider } from '@taskin/fs-task-provider';
import { TaskManager } from '@taskin/task-manager';
import type { Command } from 'commander';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';

interface FinishOptions {
  skipUpdate?: boolean;
}

export function finishCommand(program: Command): void {
  program
    .command('finish <task-id>')
    .alias('done')
    .description('✅ Complete a task')
    .option('-s, --skip-update', 'Skip updating task status')
    .action(async (taskId: string, options: FinishOptions) => {
      try {
        await finishTask(taskId, options);
      } catch (err) {
        error(
          `Failed to finish task: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}

async function finishTask(
  taskId: string,
  options: FinishOptions,
): Promise<void> {
  printHeader(`Finishing Task ${taskId}`, '✅');

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

  // Check if task is already done
  if (task.status === 'done') {
    error('Task is already done');
    process.exit(1);
  }

  if (!options.skipUpdate) {
    info('Marking task as done...');
    const updatedTask = await taskManager.finishTask(task.id);
    success(`Task ${updatedTask.id} completed successfully! 🎉`);
    success(`Status changed to: ${updatedTask.status}`);
  } else {
    info('Skipping status update (--skip-update flag)');
  }

  console.log();
  info('Suggested commit message:');
  const commitType = task.type || 'feat';
  console.log(
    colors.highlight(`  ${commitType}(task-${normalizedId}): ${task.title}`),
  );
  console.log();

  info('Next steps:');
  console.log(colors.secondary('  1. Review your changes'));
  console.log(colors.secondary('  2. Commit: git add . && git commit'));
  console.log(colors.secondary('  3. Push: git push'));
  console.log(colors.secondary('  4. Create a Pull Request'));
  console.log();

  success('Great work! 🚀');
  console.log();
}
