#!/usr/bin/env node

/**
 * Taskin CLI - Main entry point
 * Command-line interface for managing tasks
 */

import { Command } from 'commander';
import { finishCommand } from './commands/finish.js';
import { lintCommand } from './commands/lint.js';
import { listCommand } from './commands/list.js';
import { pauseCommand } from './commands/pause.js';
import { startCommand } from './commands/start.js';
import { showCustomHelp } from './lib/help.js';

const program = new Command();

program
  .name('taskin')
  .description('🚀 Task Management System')
  .version('0.1.0')
  .configureHelp({
    formatHelp: () => showCustomHelp(),
  });

// Register commands
listCommand(program);
startCommand(program);
pauseCommand(program);
finishCommand(program);

// Lint command
program
  .command('lint')
  .description('🔍 Validate task markdown files')
  .option('-p, --path <directory>', 'Path to TASKS directory', 'TASKS')
  .action(lintCommand);

// Show custom help if no command provided
if (process.argv.length <= 2) {
  showCustomHelp();
  process.exit(0);
}

// Parse arguments
program.parse();
