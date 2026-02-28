/**
 * review command - Prepare task for code review
 * Executes quality checks and transitions task to 'in-review' status
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import type { HookContext, HookOptions } from '@opentask/taskin-types';
import { execSync } from 'child_process';
import path from 'path';
import {
  colors,
  error,
  info,
  printHeader,
  success,
  warning,
} from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { HookRunner } from '../lib/hook-runner.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { playSound } from '../lib/sound-player.js';
import { defineCommand } from './define-command/index.js';

interface ReviewTaskOptions {
  skipChecks?: boolean;
  skipMerge?: boolean;
  dryRun?: boolean;
  sound?: boolean;
}

export const reviewCommand = defineCommand({
  name: 'review <task-id>',
  description: '🔍 Prepare task for code review',
  alias: 'rv',
  options: [
    {
      flags: '--skip-checks',
      description: 'Skip quality checks',
    },
    {
      flags: '--skip-merge',
      description: 'Skip git merge',
    },
    {
      flags: '--dry-run',
      description: 'Show what would be executed without running',
    },
    {
      flags: '--no-sound',
      description: 'Disable review sound',
    },
  ],
  handler: async (taskId: string, options: ReviewTaskOptions) => {
    await reviewTask(taskId, options);
  },
});

async function reviewTask(
  taskId: string,
  options: ReviewTaskOptions,
): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader(`Reviewing Task ${taskId}`, '🔍');

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

  // Check if task is in-progress
  if (task.status !== 'in-progress') {
    error(
      `Task must be 'in-progress' to be reviewed. Current status: ${task.status}`,
    );
    process.exit(1);
  }

  // Load config
  const configManager = new ConfigManager(monorepoRoot);
  const hookSettings = configManager.getHookSettings();
  const reviewHooks = configManager.getCommandHooks('review');
  const behavior = configManager.getAutomationBehavior();

  // Initialize hook runner
  const hookRunner = new HookRunner();

  // Prepare hook context with type-safe variables
  const hookContext: HookContext = {
    taskId: normalizedId,
    taskTitle: task.title,
    baseBranch: hookSettings.baseBranch,
  };

  // Prepare hook execution options
  const hookOptions: HookOptions = {
    timeout: hookSettings.timeout,
    continueOnError: hookSettings.continueOnError,
    cwd: hookSettings.cwd ?? monorepoRoot,
  };

  console.log();

  // Dry run mode - just show what would be executed
  if (options.dryRun) {
    info('🔍 Dry run mode - showing what would be executed:');
    console.log();

    if (reviewHooks.pre && reviewHooks.pre.length > 0) {
      info('Pre-review hooks:');
      reviewHooks.pre.forEach((hook) => {
        console.log(colors.secondary(`  - ${hook}`));
      });
      console.log();
    }

    info('Status change:');
    console.log(colors.secondary(`  - Task status: in-progress → in-review`));
    console.log();

    if (reviewHooks.during && reviewHooks.during.length > 0) {
      info('Review checks:');
      reviewHooks.during.forEach((hook) => {
        console.log(colors.secondary(`  - ${hook}`));
      });
      console.log();
    }

    if (reviewHooks.post && reviewHooks.post.length > 0) {
      info('Post-review hooks:');
      reviewHooks.post.forEach((hook) => {
        console.log(colors.secondary(`  - ${hook}`));
      });
      console.log();
    }

    info('✓ Dry run complete');
    return;
  }

  // Execute pre-review hooks
  if (reviewHooks.pre && reviewHooks.pre.length > 0 && !options.skipMerge) {
    info('⏳ Executing pre-review hooks...');
    const preResults = await hookRunner.executeHooks(
      reviewHooks.pre,
      hookContext,
      hookOptions,
    );

    // Display results
    for (const result of preResults) {
      if (result.success) {
        success(`  ✓ ${result.hook} (${result.duration}ms)`);
      } else {
        error(`  ✗ ${result.hook} (${result.duration}ms)`);
        if (result.error) {
          console.log(colors.error(`    ${result.error}`));
        }
      }
    }

    // Check if any pre-hook failed
    const failedPre = preResults.find((r) => !r.success);
    if (failedPre && !hookSettings.continueOnError) {
      console.log();
      error('✗ Pre-review hooks failed!');
      error('Fix the errors above and try again.');
      process.exit(1);
    }

    console.log();
  }

  // Execute review checks (during hooks)
  if (
    reviewHooks.during &&
    reviewHooks.during.length > 0 &&
    !options.skipChecks
  ) {
    info('⏳ Executing review checks...');
    const duringResults = await hookRunner.executeHooks(
      reviewHooks.during,
      hookContext,
      hookOptions,
    );

    // Display results
    for (const result of duringResults) {
      if (result.success) {
        success(`  ✓ ${result.hook} (${result.duration}ms)`);
      } else {
        error(`  ✗ ${result.hook} (${result.duration}ms)`);
        if (result.error) {
          console.log(colors.error(`    ${result.error}`));
        }
      }
    }

    // Check if any check failed
    const failedCheck = duringResults.find((r) => !r.success);
    if (failedCheck && !hookSettings.continueOnError) {
      console.log();
      error('✗ Review checks failed!');
      error('Fix the errors above and try again.');
      console.log();
      info('Tip: Run individual checks to see full error details');
      process.exit(1);
    }

    console.log();
  }

  // Update task status
  info('Marking task as ready for review...');
  const updatedTask = await taskManager.reviewTask(task.id);
  success(`✓ Task ${updatedTask.id} status changed to: ${updatedTask.status}`);

  // Auto-commit status change if enabled
  if (behavior.autoCommitStatusChange) {
    try {
      execSync(
        `git add TASKS/task-${normalizedId}-*.md && git commit -m "docs(TASKS): task-${normalizedId} - mark as ready for review [skip-ci]"`,
        { cwd: monorepoRoot, stdio: 'ignore' },
      );
      success('✓ Auto-committed status change');
    } catch {
      // Ignore if nothing to commit
    }
  }

  console.log();

  // Execute post-review hooks
  if (reviewHooks.post && reviewHooks.post.length > 0) {
    info('⏳ Executing post-review hooks...');
    const postResults = await hookRunner.executeHooks(
      reviewHooks.post,
      hookContext,
      hookOptions,
    );

    // Display results
    for (const result of postResults) {
      if (result.success) {
        success(`  ✓ ${result.hook} (${result.duration}ms)`);
      } else {
        warning(`  ⚠ ${result.hook} (${result.duration}ms)`);
        if (result.error) {
          console.log(colors.warning(`    ${result.error}`));
        }
      }
    }

    console.log();
  }

  // Calculate total duration
  const totalDuration =
    [
      ...(reviewHooks.pre ?? []),
      ...(reviewHooks.during ?? []),
      ...(reviewHooks.post ?? []),
    ].length > 0
      ? 'with hooks'
      : '';

  success(`✓ Task ready for review! ${totalDuration}`);

  // Play sound if enabled
  if (options.sound !== false) {
    await playSound('review');
  }

  console.log();

  // Show next steps
  if (!behavior.autoCommitStatusChange) {
    info('Next steps:');
    console.log(
      colors.secondary(
        `  1. Commit status change: git add TASKS/task-${normalizedId}-*.md && git commit -m "docs(TASKS): task-${normalizedId} - mark as ready for review"`,
      ),
    );
    console.log(colors.secondary('  2. Push changes: git push origin HEAD'));
    console.log(colors.secondary('  3. Request reviewers'));
  } else {
    info('Next steps:');
    console.log(colors.secondary('  1. Request reviewers'));
    console.log(colors.secondary('  2. Monitor CI/CD pipeline'));
    console.log(colors.secondary('  3. Address review feedback'));
  }

  console.log();
}
