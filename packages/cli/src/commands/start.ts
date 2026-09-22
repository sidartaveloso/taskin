/**
 * start command - Start a task
 */

import { buildTaskStatusCommitMessage, GitService, type IGitService } from '@opentask/taskin-git-utils';
import { TaskManager } from '@opentask/taskin-task-manager';
import path from 'path';
import { resolveCiSkipTag } from '../lib/ci-skip-tag/index.js';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { sendTaskNotification } from '../lib/notification/notify-helper.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { playSound } from '../lib/sound-player.js';
import { normalizeTaskId } from '../lib/task-id.js';
import { defineCommand } from './define-command/index.js';

interface StartTaskOptions {
  force?: boolean;
  base?: string;
  sound?: boolean;
  dryRun?: boolean;
  /** `false` com --no-skip-ci: nao marca o commit de status. */
  skipCi?: boolean;
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
    {
      flags: '--dry-run',
      description: 'Show what would be executed without running',
    },
    {
      flags: '--no-skip-ci',
      description: 'Write the status commit without the CI-skip tag',
    },
  ],
  handler: async (taskId: string, options: StartTaskOptions) => {
    await startTask(taskId, options);
  },
});

async function startTask(taskId: string, options: StartTaskOptions, gitService?: IGitService): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Starting Task ${taskId}`, '🚀');

  // Normalize task ID
  const normalizedId = normalizeTaskId(taskId);
  if (!normalizedId) {
    error(`'${taskId}' is not a task id. Expected something like 020 or task-020.`);
    process.exit(1);
  }

  const { provider: taskProvider, userRegistry, projectRoot: monorepoRoot } = await resolveTaskProvider();

  // Ensure the current user exists in the registry
  await userRegistry.ensureCurrentUser();

  const taskManager = new TaskManager(taskProvider);

  // Find task
  const task = await taskProvider.findTask(normalizedId);

  if (!task) {
    error(`Task ${normalizedId} not found in TASKS/ directory`);
    process.exit(1);
  }

  info(`Found task: ${task.title}`);
  info(`Current status: ${task.status}`);

  // Load automation config. Read before the dry run so the preview shows the
  // commit this project would actually make, tag included.
  const configManager = new ConfigManager(monorepoRoot);
  const behavior = configManager.getAutomationBehavior();
  const ciSkipTag = resolveCiSkipTag(behavior.ciSkipTag, options.skipCi);
  const statusCommitMessage = buildTaskStatusCommitMessage({
    taskId: normalizedId,
    status: 'in-progress',
    ciSkipTag,
  });

  // Dry run mode - show what would be executed
  if (options.dryRun) {
    console.log();
    info('🔍 Dry run mode - showing what would be executed:');
    console.log();

    info('Status change:');
    console.log(colors.secondary(`  - Task status: ${task.status} → in-progress`));
    console.log();

    info('Git operations:');
    console.log(colors.secondary(`  - Create branch: git checkout -b feat/task-${normalizedId}`));
    console.log(
      colors.secondary(
        `  - Commit status: git add TASKS/task-${normalizedId}-*.md && git commit -m "${statusCommitMessage}"`,
      ),
    );
    console.log();

    info('Dry run complete');
    return;
  }

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

  // Initialize Git service
  const git = gitService ?? new GitService(process.cwd(), { ciSkipTag });

  // Auto-commit status change if enabled
  if (behavior.autoCommitStatusChange) {
    const committed = await git.commitTaskStatusChangeOnBranch(normalizedId, 'in-progress', behavior.defaultBranch);
    if (committed) {
      success('Auto-committed status change');
      // Ignore if nothing to commit
    }
  }

  console.log();

  // Show suggestions only if not auto-committing
  if (!behavior.autoCommitStatusChange) {
    info('Next steps (suggestions):');
    console.log(
      colors.secondary(
        `  1. Commit the status change: git add TASKS/task-${normalizedId}-*.md && git commit -m "${statusCommitMessage}"`,
      ),
    );
    console.log(colors.secondary(`  2. Create a branch: git checkout -b feat/task-${normalizedId}`));
    console.log(colors.secondary('  3. Start coding! 💻'));
    console.log(colors.secondary('  4. Use "taskin pause" to save progress'));
  } else {
    info('Next steps:');
    console.log(colors.secondary(`  1. Create a branch: git checkout -b feat/task-${normalizedId}`));
    console.log(colors.secondary('  2. Start coding! 💻'));
    console.log(colors.secondary('  3. Use "taskin pause" to save progress'));
  }
  console.log();

  // Send notification
  await sendTaskNotification(configManager, 'task:start', normalizedId, task.title);

  // Play start sound if not disabled
  if (options.sound !== false) {
    playSound('start');
  }
}
