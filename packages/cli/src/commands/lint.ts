import { join } from 'path';
import { TaskLinter } from '../lib/task-linter.js';

interface LintOptions {
  path?: string;
}

export async function lintCommand(options: LintOptions): Promise<void> {
  const tasksDir = options.path || join(process.cwd(), 'TASKS');

  console.log(`📋 Linting task files in: ${tasksDir}\n`);

  const linter = new TaskLinter();

  try {
    const result = await linter.lint(tasksDir);
    TaskLinter.printResults(result);

    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
