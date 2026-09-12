/**
 * finish command - Finish a task
 */

import { squashTaskFileOnDone } from '@opentask/taskin-file-system-provider';
import { buildTaskStatusCommitMessage, GitService, type IGitService } from '@opentask/taskin-git-utils';
import { TaskManager } from '@opentask/taskin-task-manager';
import { execSync } from 'child_process';
import path from 'path';
import { colors, error, info, printHeader, success, warning } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { sendTaskNotification } from '../lib/notification/notify-helper.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { playSound } from '../lib/sound-player.js';
import { normalizeTaskId } from '../lib/task-id.js';
import { defineCommand } from './define-command/index.js';

interface FinishTaskOptions {
  skipUpdate?: boolean;
  sound?: boolean;
  dryRun?: boolean;
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
    {
      flags: '--dry-run',
      description: 'Show what would be executed without running',
    },
  ],
  handler: async (taskId: string, options: FinishTaskOptions) => {
    await finishTask(taskId, options);
  },
});

export async function finishTask(taskId: string, options: FinishTaskOptions, gitService?: IGitService): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Finishing Task ${taskId}`, '✅');

  // Normalize task ID
  const normalizedId = normalizeTaskId(taskId);
  if (!normalizedId) {
    error(`'${taskId}' is not a task id. Expected something like 020 or task-020.`);
    process.exit(1);
  }

  const { provider: taskProvider, projectRoot: monorepoRoot } = await resolveTaskProvider();
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
  const autoSyncActive = behavior.autoSync && !!behavior.defaultBranch;
  const statusCommitMessage = buildTaskStatusCommitMessage({
    taskId: normalizedId,
    status: 'done',
    ciSkipTag: behavior.ciSkipTag,
  });

  // Dry run mode - show what would be executed
  if (options.dryRun) {
    console.log();
    info('🔍 Dry run mode - showing what would be executed:');
    console.log();

    info('Status change:');
    console.log(colors.secondary(`  - Task status: ${task.status} → done`));
    console.log();

    const commitType = task.type || 'feat';
    info('Git operations:');
    console.log(
      colors.secondary(
        `  - Commit status: git add TASKS/task-${normalizedId}-*.md && git commit -m "${statusCommitMessage}"`,
      ),
    );
    console.log(
      colors.secondary(
        `  - Commit work: git add . && git commit -m "${commitType}(task-${normalizedId}): ${task.title}"`,
      ),
    );
    console.log(colors.secondary(`  - Push: git push`));
    console.log();

    info('Dry run complete');
    return;
  }

  // Check if task is already done
  if (task.status === 'done') {
    error('Task is already done');
    process.exit(1);
  }

  if (behavior.autoSync && !behavior.defaultBranch) {
    warning('autoSync is enabled but no defaultBranch is configured. Nothing will be synced.');
  }

  // Initialize Git service
  const git = gitService ?? new GitService(process.cwd(), { ciSkipTag: behavior.ciSkipTag });

  if (!options.skipUpdate) {
    info('Marking task as done...');
    const updatedTask = await taskManager.finishTask(task.id);
    success(`Task ${updatedTask.id} completed successfully! 🎉`);
    success(`Status changed to: ${updatedTask.status}`);

    // Auto-commit status change if enabled
    if (behavior.autoCommitStatusChange) {
      const committed = await git.commitTaskStatusChangeOnBranch(normalizedId, 'done', behavior.defaultBranch);
      if (committed) {
        success('Auto-committed status change');
      }
    }

    // Squash the task file into a single commit on originBranch when done
    if (behavior.autoSync && behavior.originBranch && behavior.defaultBranch) {
      try {
        const squashed = await squashTaskFileOnDone(git, {
          taskId: normalizedId,
          defaultBranch: behavior.defaultBranch,
          originBranch: behavior.originBranch,
          ciSkipTag: behavior.ciSkipTag,
        });
        if (squashed) {
          success(`Squash commit pushed to ${behavior.originBranch}`);
        }
      } catch (squashError) {
        error(
          squashError instanceof Error
            ? `Squash failed: ${squashError.message}`
            : 'Squash failed. Task marked as done locally.',
        );
      }
    }

    // Auto-commit work if autopilot is enabled
    if (behavior.autoCommitFinish) {
      const commitType = task.type || 'feat';
      try {
        execSync('git add .', { cwd: process.cwd(), stdio: 'ignore' });
        execSync(`git commit -m "${commitType}(task-${normalizedId}): ${task.title}"`, {
          cwd: process.cwd(),
          stdio: 'ignore',
        });
        success('Auto-committed completed work');
      } catch {
        // Ignore if nothing to commit
      }
    }
  } else {
    info('Skipping status update (--skip-update flag)');
  }

  console.log();

  // Show suggestions only if not auto-committing
  if (!behavior.autoCommitFinish || options.skipUpdate) {
    info('Next steps (suggestions):');
    const steps: string[] = [];
    const commitType = task.type || 'feat';

    if (!options.skipUpdate) {
      if (!behavior.autoCommitStatusChange) {
        steps.push(
          `Commit the status change: git add TASKS/task-${normalizedId}-*.md && git commit -m "${statusCommitMessage}"`,
        );
      }
      steps.push('Review your changes');
      if (!behavior.autoCommitFinish) {
        steps.push(`Commit your work: git add . && git commit -m "${commitType}(task-${normalizedId}): ${task.title}"`);
      }
      if (!autoSyncActive) {
        steps.push('Push: git push');
      }
      steps.push('Create a Pull Request');
    } else {
      steps.push('Review your changes');
      if (!behavior.autoCommitFinish) {
        steps.push(`Commit your work: git add . && git commit -m "${commitType}(task-${normalizedId}): ${task.title}"`);
      }
      if (!autoSyncActive) {
        steps.push('Push: git push');
      }
      steps.push('Create a Pull Request');
    }

    steps.forEach((step, index) => {
      console.log(colors.secondary(`  ${index + 1}. ${step}`));
    });
    console.log();
  } else {
    info('All commits done automatically (autopilot mode)');
    info('Next steps:');
    console.log(colors.secondary('  1. Create a Pull Request'));
    console.log();
  }

  success('Great work! 🚀');
  console.log();

  // Send notification
  await sendTaskNotification(configManager, 'task:done', normalizedId, task.title);

  // Play finish sound if not disabled
  if (options.sound !== false) {
    playSound('finish');
  }
}
