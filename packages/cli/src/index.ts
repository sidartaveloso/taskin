#!/usr/bin/env node

/**
 * Taskin CLI - Main entry point
 * Command-line interface for managing tasks
 */

import { Command } from 'commander';
import { registerCommands } from './commands/register.js';
import { showCustomHelp } from './lib/help.js';
import { loadDotEnv } from './lib/notification/env-resolver.js';
import { getVersion } from './version.js';

// Load .env file from project root (optional, keeps secrets out of .taskin.json)
loadDotEnv();

const program = new Command();

program.name('taskin').description('🚀 Task Management System').version(getVersion());

// Override help option to show custom help
program.helpOption('-h, --help', 'Display help information');

// Add explicit help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    showCustomHelp(program);
  });

// Register commands
registerCommands(program);

// Intercept --help at root level
program.on('option:help', () => {
  showCustomHelp(program);
  process.exit(0);
});

// Show custom help if no command provided
if (process.argv.length <= 2) {
  showCustomHelp(program);
  process.exit(0);
}

// Show custom help if only --help is provided
if (process.argv.length === 3 && (process.argv[2] === '--help' || process.argv[2] === '-h')) {
  showCustomHelp(program);
  process.exit(0);
}

// Parse arguments
program.parse();

// Export for programmatic usage
export { createTaskin, getTaskin } from './main.js';
export { Taskin } from './taskin.js';
