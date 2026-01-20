#!/usr/bin/env node

/**
 * Taskin CLI - Main entry point
 * Command-line interface for managing tasks
 */

import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { dashboardCommand } from './commands/dashboard.js';
import { registerExportCommand } from './commands/export.js';
import { finishCommand } from './commands/finish.js';
import { initCommand } from './commands/init.js';
import { lintCommand } from './commands/lint.js';
import { listCommand } from './commands/list.js';
import { mcpServerCommand } from './commands/mcp-server.js';
import { createCommand } from './commands/new.js';
import { pauseCommand } from './commands/pause.js';
import { startCommand } from './commands/start.js';
import { statsCommand } from './commands/stats.js';
import { showCustomHelp } from './lib/help.js';
import { getVersion } from './version.js';

const program = new Command();

program
  .name('taskin')
  .description('🚀 Task Management System')
  .version(getVersion());

// Override help option to show custom help
program.helpOption('-h, --help', 'Display help information');

// Add explicit help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    showCustomHelp();
  });

// Register commands
initCommand(program);
listCommand(program);
createCommand(program);
startCommand(program);
pauseCommand(program);
finishCommand(program);
statsCommand(program);
configCommand(program);
registerExportCommand(program);
lintCommand(program);
dashboardCommand(program);
mcpServerCommand(program);

// Intercept --help at root level
program.on('option:help', () => {
  showCustomHelp();
  process.exit(0);
});

// Show custom help if no command provided
if (process.argv.length <= 2) {
  showCustomHelp();
  process.exit(0);
}

// Show custom help if only --help is provided
if (
  process.argv.length === 3 &&
  (process.argv[2] === '--help' || process.argv[2] === '-h')
) {
  showCustomHelp();
  process.exit(0);
}

// Parse arguments
program.parse();

// Export for programmatic usage
export { createTaskin, getTaskin } from './main.js';
export { Taskin } from './taskin.js';
