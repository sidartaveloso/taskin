/**
 * Lint command - Validate task markdown files
 */

import type { LintTasksOptions } from '@opentask/taskin-types';
import { join } from 'path';
import { FileSystemTaskLinter } from '../lib/file-system-task-linter/index.js';
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
  ],
  handler: async (options: LintTasksOptions) => {
    await executeLint(options);
  },
});

async function executeLint(options: LintTasksOptions): Promise<void> {
  const tasksDir = options.path || join(process.cwd(), 'TASKS');

  console.log(`📋 Linting task files in: ${tasksDir}\n`);

  const linter = new FileSystemTaskLinter();
  const result = await linter.lintDirectory(tasksDir);
  FileSystemTaskLinter.printResults(result);

  if (!result.valid) {
    process.exit(1);
  }
}
