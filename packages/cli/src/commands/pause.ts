/**
 * pause command - Pause an in-progress task
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import type { PauseTaskOptions } from '@opentask/taskin-types';
import { execSync } from 'child_process';
import path from 'path';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { playSound } from '../lib/sound-player.js';
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
    {
      flags: '--no-sound',
      description: 'Disable pause sound',
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
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Pausing Task ${taskId}`, '⏸️');

  // Normalize task ID
  const normalizedId = taskId.replace(/^task-/, '').padStart(3, '0');

  // Find TASKS directory
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize UserRegistry
  const monorepoRoot = path.dirname(tasksDir);
  const taskinDir = path.join(monorepoRoot, '.taskin');
  const userRegistry = new UserRegistry({ taskinDir });
  await userRegistry.load();

  // Initialize task provider
  const taskProvider = new FileSystemTaskProvider(tasksDir, userRegistry);

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

    // Create git commit
    try {
      execSync('git add -A', { cwd: process.cwd(), stdio: 'ignore' });
      execSync(`git commit -m "${commitMessage}"`, {
        cwd: process.cwd(),
        stdio: 'ignore',
      });
    } catch {
      // Ignore errors - might be nothing to commit
    }

    // Update task status back to pending
    const updatedTask = { ...task, status: 'pending' as const };
    await taskProvider.updateTask(updatedTask);

    success('Task paused successfully!');
    info('Commit created (not pushed)');
    info('Status updated to pending');
    console.log();
    info('Next steps:');
    console.log(colors.secondary('  1. Switch to another task'));
    console.log(
      colors.secondary('  2. Or continue later with the same branch'),
    );

    // Play stop sound if not disabled
    if (options.sound !== false) {
      playSound('stop');
    }
  }

  console.log();
}
