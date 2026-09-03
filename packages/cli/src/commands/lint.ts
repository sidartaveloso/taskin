/**
 * Lint command - Validate task markdown files
 */

import { FileSystemTaskProvider, UserRegistry } from '@opentask/taskin-file-system-provider';
import type { LintTasksOptions } from '@opentask/taskin-types';
import chalk from 'chalk';
import { join } from 'path';
import { defineCommand } from './define-command/index.js';

export const lintCommand = defineCommand({
  name: 'lint',
  description: '🔍 Validate task markdown files',
  options: [
    {
      flags: '-p, --path <directory>',
      description: 'Path to TASKS directory',
      defaultValue: 'TASKS',
    },
    {
      flags: '-f, --fix',
      description: 'Automatically fix task file format issues',
    },
  ],
  handler: async (options: LintTasksOptions) => {
    await executeLint(options);
  },
});

async function executeLint(options: LintTasksOptions): Promise<void> {
  const tasksDir = options.path || join(process.cwd(), 'TASKS');

  if (options.fix) {
    console.log(`🔧 Fixing task files in: ${tasksDir}\n`);
  } else {
    console.log(`📋 Linting task files in: ${tasksDir}\n`);
  }

  // Initialize UserRegistry and FileSystemTaskProvider
  const userRegistry = new UserRegistry({
    taskinDir: join(process.cwd(), '.taskin'),
  });
  await userRegistry.load();

  const provider = new FileSystemTaskProvider(tasksDir, userRegistry);
  const result = await provider.lint(options.fix);

  // Print results. Warnings and infos are printed even when the run is valid:
  // a stale user registry is reported as a warning, and swallowing it was how
  // the misplaced .taskin-users.json went unnoticed for so long.
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  const notices = result.issues.filter((issue) => issue.severity !== 'error');

  if (errors.length > 0) {
    console.log(chalk.red(`\n❌ Found ${errors.length} error(s):\n`));
    for (const issue of errors) {
      console.log(chalk.yellow(`  ${issue.file}: ${issue.message}`));
      if (issue.suggestion) {
        console.log(chalk.dim(`    ↳ ${issue.suggestion}`));
      }
    }
    console.log();
  }

  for (const issue of notices) {
    const label = issue.severity === 'warning' ? chalk.yellow('⚠') : chalk.blue('ℹ');
    console.log(`${label} ${issue.file}: ${issue.message}`);
    if (issue.suggestion) {
      console.log(chalk.dim(`    ↳ ${issue.suggestion}`));
    }
  }
  if (notices.length > 0) {
    console.log();
  }

  if (result.valid) {
    console.log(chalk.green(`✅ All task files are valid!\n`));
  }

  if (!result.valid && !options.fix) {
    console.log(chalk.blue(`💡 Run with --fix to automatically fix format issues\n`));
    process.exit(1);
  }
}
