/**
 * config command - Configure Taskin settings
 */

import type { AutomationLevel } from '@opentask/taskin-types';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface ConfigOptions {
  level?: string;
  show?: boolean;
}

export const configCommand = defineCommand({
  name: 'config',
  description: '⚙️  Configure Taskin settings',
  options: [
    {
      flags: '-l, --level <level>',
      description: 'Set automation level (manual|assisted|autopilot)',
    },
    {
      flags: '-s, --show',
      description: 'Show current configuration',
    },
  ],
  handler: async (options: ConfigOptions) => {
    await handleConfigCommand(options);
  },
});

async function handleConfigCommand(options: ConfigOptions): Promise<void> {
  requireTaskinProject();

  const configManager = new ConfigManager(process.cwd());

  // Show current config
  if (options.show) {
    await showConfiguration(configManager);
    return;
  }

  // Set automation level
  if (options.level) {
    await setAutomationLevel(configManager, options.level);
    return;
  }

  // Interactive mode
  await interactiveConfig(configManager);
}

async function showConfiguration(configManager: ConfigManager): Promise<void> {
  printHeader('Current Configuration', '⚙️');

  try {
    const config = configManager.loadConfig();
    const automationLevel = configManager.getAutomationLevel();
    const behavior = configManager.getAutomationBehavior();

    console.log(chalk.bold('\n📋 General'));
    console.log(`  Version: ${chalk.cyan(config.version)}`);
    console.log(`  Provider: ${chalk.cyan(config.provider.type)}\n`);

    console.log(chalk.bold('🤖 Automation'));
    console.log(`  Level: ${chalk.cyan(automationLevel)}`);
    console.log(
      `  Auto-commit status changes: ${behavior.autoCommitStatusChange ? chalk.green('✓ Yes') : chalk.red('✗ No')}`,
    );
    console.log(
      `  Auto-commit on pause: ${behavior.autoCommitPause ? chalk.green('✓ Yes') : chalk.red('✗ No')}`,
    );
    console.log(
      `  Auto-commit on finish: ${behavior.autoCommitFinish ? chalk.green('✓ Yes') : chalk.red('✗ No')}\n`,
    );

    // Show level descriptions
    console.log(chalk.bold('📖 Available Levels:'));
    console.log(
      `  ${chalk.yellow('manual')}    - You're in control: all commits are suggestions only`,
    );
    console.log(
      `  ${chalk.yellow('assisted')}  - Smart suggestions: auto-commits status changes, suggests work commits`,
    );
    console.log(
      `  ${chalk.yellow('autopilot')} - Let Taskin drive: auto-commits everything\n`,
    );
  } catch (err) {
    error('Failed to load configuration');
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
    }
    process.exit(1);
  }
}

async function setAutomationLevel(
  configManager: ConfigManager,
  level: string,
): Promise<void> {
  printHeader('Configure Automation Level', '⚙️');

  // Validate level
  const validLevels: AutomationLevel[] = ['manual', 'assisted', 'autopilot'];
  if (!validLevels.includes(level as AutomationLevel)) {
    error(
      `Invalid automation level: ${level}. Valid options: ${validLevels.join(', ')}`,
    );
    process.exit(1);
  }

  try {
    const currentLevel = configManager.getAutomationLevel();

    if (currentLevel === level) {
      info(`Automation level is already set to ${colors.highlight(level)}`);
      return;
    }

    configManager.setAutomationLevel(level as AutomationLevel);
    success(`✓ Automation level set to ${colors.highlight(level)}`);

    // Show what changed
    const behavior = configManager.getAutomationBehavior();
    console.log(chalk.dim('\nCurrent behavior:'));
    console.log(
      chalk.dim(
        `  Auto-commit status changes: ${behavior.autoCommitStatusChange ? '✓' : '✗'}`,
      ),
    );
    console.log(
      chalk.dim(
        `  Auto-commit on pause: ${behavior.autoCommitPause ? '✓' : '✗'}`,
      ),
    );
    console.log(
      chalk.dim(
        `  Auto-commit on finish: ${behavior.autoCommitFinish ? '✓' : '✗'}`,
      ),
    );
  } catch (err) {
    error('Failed to update configuration');
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
    }
    process.exit(1);
  }
}

async function interactiveConfig(configManager: ConfigManager): Promise<void> {
  printHeader('Configure Taskin', '⚙️');

  try {
    const currentLevel = configManager.getAutomationLevel();

    console.log(`Current automation level: ${chalk.cyan(currentLevel)}\n`);

    const { level } = await inquirer.prompt<{ level: AutomationLevel }>([
      {
        type: 'list',
        name: 'level',
        message: 'Select automation level:',
        default: currentLevel,
        choices: [
          {
            name: '🔧 manual - You control all commits (suggestions only)',
            value: 'manual',
          },
          {
            name: '🤝 assisted - Auto-commit status changes, suggest work commits (recommended)',
            value: 'assisted',
          },
          {
            name: '🚀 autopilot - Auto-commit everything',
            value: 'autopilot',
          },
        ],
      },
    ]);

    if (level === currentLevel) {
      info(`Keeping current automation level: ${colors.highlight(level)}`);
      return;
    }

    configManager.setAutomationLevel(level);
    success(`✓ Automation level set to ${colors.highlight(level)}`);

    // Show new behavior
    const behavior = configManager.getAutomationBehavior();
    console.log(chalk.dim('\nNew behavior:'));
    console.log(
      chalk.dim(
        `  Auto-commit status changes: ${behavior.autoCommitStatusChange ? '✓' : '✗'}`,
      ),
    );
    console.log(
      chalk.dim(
        `  Auto-commit on pause: ${behavior.autoCommitPause ? '✓' : '✗'}`,
      ),
    );
    console.log(
      chalk.dim(
        `  Auto-commit on finish: ${behavior.autoCommitFinish ? '✓' : '✗'}`,
      ),
    );
  } catch (err) {
    error('Configuration cancelled or failed');
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
    }
    process.exit(1);
  }
}
