/**
 * Lint command - Validate task markdown files
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
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

  // Print results
  if (result.valid) {
    console.log(chalk.green(`✅ All task files are valid!\n`));
  } else {
    console.log(chalk.red(`\n❌ Found ${result.issues.length} issue(s):\n`));
    for (const issue of result.issues) {
      console.log(chalk.yellow(`  ${issue.file}: ${issue.message}`));
    }
    console.log();
  }

  if (!result.valid && !options.fix) {
    console.log(
      chalk.blue(`💡 Run with --fix to automatically fix format issues\n`),
    );
    process.exit(1);
  }
}
