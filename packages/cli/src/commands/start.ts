/**
 * start command - Start a task
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

interface StartTaskOptions {
  force?: boolean;
  base?: string;
  sound?: boolean;
}

export const startCommand = defineCommand({
  name: 'start <task-id>',
  description: '🚀 Start working on a task',
  alias: 'begin',
  options: [
    {
      flags: '-f, --force',
      description: 'Force start even with uncommitted changes',
    },
    {
      flags: '-b, --base <branch>',
      description: 'Base branch to create from (default: current)',
    },
    {
      flags: '--no-sound',
      description: 'Disable start sound',
    },
  ],
  handler: async (taskId: string, options: StartTaskOptions) => {
    await startTask(taskId, options);
  },
});

async function startTask(
  taskId: string,
  _options: StartTaskOptions,
): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Starting Task ${taskId}`, '🚀');

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

  // Play start sound if not disabled
  if (_options.sound !== false) {
    playSound('start');
  }
}
