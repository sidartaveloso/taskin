/**
 * finish command - Finish a task
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { playSound } from '../lib/sound-player.js';
import { defineCommand } from './define-command/index.js';

interface FinishTaskOptions {
  skipUpdate?: boolean;
  sound?: boolean;
}

export const finishCommand = defineCommand({
  name: 'finish <task-id>',
  description: '✅ Complete a task',
  alias: 'done',
  options: [
    {
      flags: '-s, --skip-update',
      description: 'Skip updating task status',
    },
    {
      flags: '--no-sound',
      description: 'Disable finish sound',
    },
  ],
  handler: async (taskId: string, options: FinishTaskOptions) => {
    await finishTask(taskId, options);
  },
});

async function finishTask(
  taskId: string,
  options: FinishTaskOptions,
): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Finishing Task ${taskId}`, '✅');

  // Normalize task ID
  const normalizedId = taskId.replace(/^task-/, '').padStart(3, '0');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize UserRegistry
  const monorepoRoot = path.dirname(tasksDir);
  const taskinDir = path.join(monorepoRoot, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });
  await userRegistry.load();

  // Initialize task manager
  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);
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

  // Play finish sound if not disabled
  if (options.sound !== false) {
    playSound('finish');
  }
}
