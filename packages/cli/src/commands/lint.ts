/**
 * Lint command - Validate task markdown files
 */

import type { LintTasksOptions } from '@opentask/taskin-types';
import chalk from 'chalk';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

/**
 * Marking styles the file provider understands.
 *
 * Duplicated as a literal instead of imported so the CLI's help text does not
 * pull the file provider into the startup path — it is loaded lazily, by the
 * factory, only when `provider.type` is `fs`.
 */
const METADATA_STYLES = ['list', 'hard-break', 'plain'] as const;

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
    {
      flags: '-m, --metadata-style <style>',
      description: `Rewrite the metadata block in this style with --fix (${METADATA_STYLES.join(' | ')})`,
    },
  ],
  handler: async (options: LintTasksOptions) => {
    await executeLint(options);
  },
});

async function executeLint(options: LintTasksOptions): Promise<void> {
  const style = options.metadataStyle;

  if (style !== undefined && !(METADATA_STYLES as readonly string[]).includes(style)) {
    console.error(chalk.red(`Unknown metadata style "${style}". Use one of: ${METADATA_STYLES.join(', ')}.`));
    process.exit(1);
  }

  // Converter e escrever: pedir o estilo sem `--fix` nao faria nada, e um
  // comando que aceita a flag e a ignora e pior do que um que recusa.
  if (style !== undefined && !options.fix) {
    console.error(chalk.red('--metadata-style rewrites files, so it requires --fix.'));
    process.exit(1);
  }

  const { provider, providerType } = await resolveTaskProvider({
    ...(options.path ? { tasksDir: options.path } : {}),
    ...(style !== undefined && { configOverrides: { metadataStyle: style, convertMetadataStyleTo: style } }),
  });

  if (options.fix) {
    console.log(`🔧 Fixing tasks (provider: ${providerType})\n`);
  } else {
    console.log(`📋 Linting tasks (provider: ${providerType})\n`);
  }

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
