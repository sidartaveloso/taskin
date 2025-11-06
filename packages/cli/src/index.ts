#!/usr/bin/env node

/**
 * Taskin CLI - Main entry point
 * Command-line interface for managing tasks
 */

import { Command } from 'commander';
import { finishCommand } from './commands/finish.js';
import { initCommand } from './commands/init.js';
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
initCommand(program);
listCommand(program);
startCommand(program);
pauseCommand(program);
finishCommand(program);
lintCommand(program);

// Show custom help if no command provided
if (process.argv.length <= 2) {
  showCustomHelp();
  process.exit(0);
}

// Parse arguments
program.parse();

// Export for programmatic usage
export type { ITaskin } from '@taskin/types-ts';
export { createTaskin, getTaskin } from './main.js';
export { Taskin } from './taskin.js';
