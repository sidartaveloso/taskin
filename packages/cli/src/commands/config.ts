/**
 * config command - Configure Taskin settings
 */

import { CI_SKIP_TAGS, DEFAULT_CI_SKIP_TAG, isRecognizedCiSkipTag } from '@opentask/taskin-git-utils';
import type { AutomationLevel, NotificationEvent } from '@opentask/taskin-types';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

/**
 * Parsed flags for `taskin config`.
 *
 * Commander camel-cases dashed flags, so `--discord-webhook` arrives as
 * `discordWebhook`. This interface used to spell them with the dash, which
 * meant those two flags silently fell through to the interactive prompt.
 */
interface ConfigOptions {
  level?: string;
  show?: boolean;
  discordWebhook?: string;
  notificationEvents?: string;
  ciSkipTag?: string;
}

/**
 * The word a user types to mean "append no tag at all".
 *
 * An empty string on the command line is awkward to pass and easy to type by
 * accident, so the intent gets a name.
 */
const NO_CI_SKIP_TAG_KEYWORD = 'none';

/**
 * Normalizes what the user typed into what gets stored.
 *
 * `none` (in any capitalization) and an empty input both mean "no tag".
 */
export function normalizeCiSkipTagInput(input: string): string {
  const trimmed = input.trim();

  return trimmed.toLowerCase() === NO_CI_SKIP_TAG_KEYWORD ? '' : trimmed;
}

/**
 * How an effective tag reads in `--show`.
 */
export function describeCiSkipTag(tag: string): string {
  return tag.length === 0 ? 'no tag — CI runs on status commits' : tag;
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
    {
      flags: '--discord-webhook <url>',
      description: 'Set Discord webhook URL for notifications (use ${ENV_VAR} to keep secrets out of config)',
    },
    {
      flags: '--notification-events <events>',
      description: 'Comma-separated events (task:start,task:done,task:review)',
    },
    {
      flags: '--ci-skip-tag <tag>',
      description: `Tag appended to Taskin's own commits so they skip CI (default "${DEFAULT_CI_SKIP_TAG}"; "none" to run CI)`,
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

  // Set CI skip tag
  if (options.ciSkipTag !== undefined) {
    setCiSkipTag(configManager, options.ciSkipTag);
    return;
  }

  // Set Discord notification
  if (options.discordWebhook) {
    await setDiscordNotification(configManager, options.discordWebhook, options.notificationEvents);
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
    console.log(`  Auto-commit on pause: ${behavior.autoCommitPause ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
    console.log(`  Auto-commit on finish: ${behavior.autoCommitFinish ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
    console.log(`  CI skip tag: ${chalk.cyan(describeCiSkipTag(configManager.getCiSkipTag()))}\n`);

    console.log(chalk.bold('🔔 Notifications'));
    const notifications = configManager.getNotifications();
    if (notifications?.discord) {
      console.log(`  Discord: ${chalk.green('✓ Configured')}`);
      console.log(`    Webhook: ${chalk.cyan(notifications.discord.webhookUrl.replace(/https?:\/\/[^/]+/, '***'))}`);
      console.log(`    Events: ${chalk.cyan(notifications.discord.events.join(', '))}`);
    } else {
      console.log(`  Discord: ${chalk.red('✗ Not configured')}`);
    }
    if (notifications?.telegram) {
      console.log(`  Telegram: ${chalk.green('✓ Configured')}`);
      console.log(`    Bot Token: ${chalk.cyan(`${notifications.telegram.botToken.slice(0, 8)}...`)}`);
      console.log(`    Chat ID: ${chalk.cyan(notifications.telegram.chatId)}`);
      console.log(`    Events: ${chalk.cyan(notifications.telegram.events.join(', '))}`);
    } else {
      console.log(`  Telegram: ${chalk.red('✗ Not configured')}`);
    }
    console.log();

    // Show level descriptions
    console.log(chalk.bold('📖 Available Levels:'));
    console.log(`  ${chalk.yellow('manual')}    - You're in control: all commits are suggestions only`);
    console.log(
      `  ${chalk.yellow('assisted')}  - Smart suggestions: auto-commits status changes, suggests work commits`,
    );
    console.log(`  ${chalk.yellow('autopilot')} - Let Taskin drive: auto-commits everything\n`);
  } catch (err) {
    error('Failed to load configuration');
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
    }
    process.exit(1);
  }
}

/**
 * Prints why a tag looks wrong, without refusing it.
 *
 * A pipeline outside the three big platforms can match anything, so the CLI
 * advises and stores. `[skip-ci]` gets named explicitly: it is the spelling
 * Taskin itself shipped, and the one Bitbucket documents as not working.
 */
function warnAboutUnrecognizedCiSkipTag(tag: string): void {
  if (tag.length === 0 || isRecognizedCiSkipTag(tag)) return;

  console.log();
  console.log(chalk.yellow('⚠️  This tag is not one GitHub, GitLab or Bitbucket documents.'));

  if (tag.replace(/\s+/g, '').toLowerCase() === '[skip-ci]') {
    console.log(chalk.dim('   "[skip-ci]" with a hyphen is not recognized anywhere — it triggers CI.'));
    console.log(chalk.dim('   Did you mean "[skip ci]", with a space?'));
  }

  console.log(chalk.dim(`   Documented tags: ${CI_SKIP_TAGS.join(', ')}`));
  console.log(chalk.dim('   Keeping it anyway — a self-hosted pipeline can match whatever it likes.'));
}

function setCiSkipTag(configManager: ConfigManager, rawTag: string): void {
  printHeader('Configure CI Skip Tag', '⚙️');

  const tag = normalizeCiSkipTagInput(rawTag);

  configManager.setCiSkipTag(tag);
  success(`CI skip tag set to ${colors.highlight(describeCiSkipTag(tag))}`);

  warnAboutUnrecognizedCiSkipTag(tag);
}

async function setDiscordNotification(
  configManager: ConfigManager,
  webhookUrl: string,
  eventsFlag?: string,
): Promise<void> {
  printHeader('Configure Discord Notification', '🔔');

  const events: NotificationEvent[] = eventsFlag
    ? eventsFlag.split(',').map((e) => e.trim() as NotificationEvent)
    : ['task:start', 'task:done'];

  const notifications = configManager.getNotifications() ?? {};
  notifications.discord = { webhookUrl, events };

  configManager.setNotifications(notifications);
  success(`Discord notification configured`);
  info(`Webhook: ${chalk.cyan(webhookUrl.replace(/https?:\/\/[^/]+/, '***'))}`);
  info(`Events: ${chalk.cyan(events.join(', '))}`);

  if (!webhookUrl.includes('${')) {
    console.log();
    console.log(chalk.yellow('⚠️  Security warning:'));
    console.log(chalk.dim('   The webhook URL is stored in plain text in .taskin.json.'));
    console.log(chalk.dim('   Use ${DISCORD_TASKIN_WEBHOOK_URL} and set the env var instead:'));
    console.log(chalk.dim(`   export DISCORD_TASKIN_WEBHOOK_URL=${webhookUrl}`));
  }
}

async function setAutomationLevel(configManager: ConfigManager, level: string): Promise<void> {
  printHeader('Configure Automation Level', '⚙️');

  // Validate level
  const validLevels: AutomationLevel[] = ['manual', 'assisted', 'autopilot'];
  if (!validLevels.includes(level as AutomationLevel)) {
    error(`Invalid automation level: ${level}. Valid options: ${validLevels.join(', ')}`);
    process.exit(1);
  }

  try {
    const currentLevel = configManager.getAutomationLevel();

    if (currentLevel === level) {
      info(`Automation level is already set to ${colors.highlight(level)}`);
      return;
    }

    configManager.setAutomationLevel(level as AutomationLevel);
    success(`Automation level set to ${colors.highlight(level)}`);

    // Show what changed
    const behavior = configManager.getAutomationBehavior();
    console.log(chalk.dim('\nCurrent behavior:'));
    console.log(chalk.dim(`  Auto-commit status changes: ${behavior.autoCommitStatusChange ? '✓' : '✗'}`));
    console.log(chalk.dim(`  Auto-commit on pause: ${behavior.autoCommitPause ? '✓' : '✗'}`));
    console.log(chalk.dim(`  Auto-commit on finish: ${behavior.autoCommitFinish ? '✓' : '✗'}`));
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
    const { section } = await inquirer.prompt<{ section: string }>([
      {
        type: 'list',
        name: 'section',
        message: 'What would you like to configure?',
        choices: [
          { name: '🤖 Automation level', value: 'automation' },
          { name: '⏭️  CI skip tag', value: 'ciSkipTag' },
          { name: '🔔 Discord notification', value: 'discord' },
          { name: '🔔 Telegram notification', value: 'telegram' },
        ],
      },
    ]);

    if (section === 'automation') {
      await configureAutomation(configManager);
    } else if (section === 'ciSkipTag') {
      await configureCiSkipTag(configManager);
    } else if (section === 'discord') {
      await configureDiscordNotification(configManager);
    } else if (section === 'telegram') {
      await configureTelegramNotification(configManager);
    }
  } catch (err) {
    error('Configuration cancelled or failed');
    if (err instanceof Error) {
      console.error(chalk.dim(err.message));
    }
    process.exit(1);
  }
}

async function configureAutomation(configManager: ConfigManager): Promise<void> {
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
  success(`Automation level set to ${colors.highlight(level)}`);

  const behavior = configManager.getAutomationBehavior();
  console.log(chalk.dim('\nNew behavior:'));
  console.log(chalk.dim(`  Auto-commit status changes: ${behavior.autoCommitStatusChange ? '✓' : '✗'}`));
  console.log(chalk.dim(`  Auto-commit on pause: ${behavior.autoCommitPause ? '✓' : '✗'}`));
  console.log(chalk.dim(`  Auto-commit on finish: ${behavior.autoCommitFinish ? '✓' : '✗'}`));
}

async function configureCiSkipTag(configManager: ConfigManager): Promise<void> {
  printHeader('Configure CI Skip Tag', '⏭️');

  const current = configManager.getCiSkipTag();
  console.log(`Current tag: ${chalk.cyan(describeCiSkipTag(current))}\n`);
  console.log(chalk.dim('Taskin appends this to the commits it writes itself — status changes and'));
  console.log(chalk.dim('task files — so they do not trigger your pipeline.\n'));

  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'list',
      name: 'choice',
      message: 'Tag for Taskin commits:',
      default: current.length === 0 ? NO_CI_SKIP_TAG_KEYWORD : current,
      choices: [
        { name: `${CI_SKIP_TAGS[0]} — GitHub, GitLab and Bitbucket (recommended)`, value: CI_SKIP_TAGS[0] },
        { name: `${CI_SKIP_TAGS[1]} — GitHub, GitLab and Bitbucket`, value: CI_SKIP_TAGS[1] },
        { name: `${CI_SKIP_TAGS[2]} — GitHub Actions only`, value: CI_SKIP_TAGS[2] },
        { name: `${CI_SKIP_TAGS[3]} — GitHub Actions only`, value: CI_SKIP_TAGS[3] },
        { name: `${CI_SKIP_TAGS[4]} — GitHub Actions only`, value: CI_SKIP_TAGS[4] },
        { name: 'none — do not mark the commits, let CI run', value: NO_CI_SKIP_TAG_KEYWORD },
        { name: 'custom… — another CI (Azure DevOps uses ***NO_CI***)', value: 'custom' },
      ],
    },
  ]);

  const tag =
    choice === 'custom'
      ? (
          await inquirer.prompt<{ customTag: string }>([
            {
              type: 'input',
              name: 'customTag',
              message: 'Tag to append:',
              default: current,
            },
          ])
        ).customTag
      : choice;

  setCiSkipTag(configManager, tag);
}

async function configureDiscordNotification(configManager: ConfigManager): Promise<void> {
  printHeader('Configure Discord Notification', '🔔');

  const notifications = configManager.getNotifications() ?? {};
  const current = notifications.discord;

  console.log(
    current
      ? `Current webhook: ${chalk.cyan(current.webhookUrl.replace(/https?:\/\/[^/]+/, '***'))}`
      : 'No Discord notification configured',
  );
  console.log();
  console.log(chalk.dim('🔒 Segurança: use ${DISCORD_TASKIN_WEBHOOK_URL} em vez da URL literal.'));
  console.log(chalk.dim('   Motivo: .taskin.json vai pro git. Se colocar a URL direta,'));
  console.log(chalk.dim('   qualquer um com acesso ao repo pode enviar mensagens no seu canal.'));
  console.log();

  const { webhookUrl } = await inquirer.prompt<{ webhookUrl: string }>([
    {
      type: 'input',
      name: 'webhookUrl',
      message: 'Discord webhook URL:',
      default: current?.webhookUrl ?? '',
      validate: (input: string) => (input.length > 0 ? true : 'Webhook URL is required'),
    },
  ]);

  const { selectedEvents } = await inquirer.prompt<{
    selectedEvents: string[];
  }>([
    {
      type: 'checkbox',
      name: 'selectedEvents',
      message: 'Select events to notify:',
      choices: [
        {
          name: 'Task started (task:start)',
          value: 'task:start',
          checked: current?.events.includes('task:start') ?? true,
        },
        {
          name: 'Task completed (task:done)',
          value: 'task:done',
          checked: current?.events.includes('task:done') ?? true,
        },
        {
          name: 'Task reviewed (task:review)',
          value: 'task:review',
          checked: current?.events.includes('task:review') ?? false,
        },
      ],
    },
  ]);

  if (selectedEvents.length === 0) {
    error('At least one event must be selected');
    return;
  }

  notifications.discord = {
    webhookUrl,
    events: selectedEvents as NotificationEvent[],
  };

  configManager.setNotifications(notifications);
  success('Discord notification configured!');
  info(`Events: ${chalk.cyan(selectedEvents.join(', '))}`);
}

async function configureTelegramNotification(configManager: ConfigManager): Promise<void> {
  printHeader('Configure Telegram Notification', '🔔');

  const notifications = configManager.getNotifications() ?? {};
  const current = notifications.telegram;

  console.log(
    current
      ? `Current bot: ${chalk.cyan(`${current.botToken.slice(0, 8)}...`)}`
      : 'No Telegram notification configured',
  );
  console.log();
  console.log(chalk.dim('🔒 Segurança: use ${TELEGRAM_BOT_TOKEN} e ${TELEGRAM_CHAT_ID} em vez dos valores literais.'));
  console.log(chalk.dim('   Motivo: .taskin.json vai pro git. Se colocar o token direto,'));
  console.log(chalk.dim('   qualquer um com acesso ao repo pode controlar seu bot do Telegram.'));
  console.log();

  const { botToken } = await inquirer.prompt<{ botToken: string }>([
    {
      type: 'input',
      name: 'botToken',
      message: 'Telegram bot token (or ${TELEGRAM_BOT_TOKEN}):',
      default: current?.botToken ?? '',
      validate: (input: string) => (input.length > 0 ? true : 'Bot token is required'),
    },
  ]);

  const { chatId } = await inquirer.prompt<{ chatId: string }>([
    {
      type: 'input',
      name: 'chatId',
      message: 'Telegram chat/group ID:',
      default: current?.chatId ?? '',
      validate: (input: string) => (input.length > 0 ? true : 'Chat ID is required'),
    },
  ]);

  const { selectedEvents } = await inquirer.prompt<{
    selectedEvents: string[];
  }>([
    {
      type: 'checkbox',
      name: 'selectedEvents',
      message: 'Select events to notify:',
      choices: [
        {
          name: 'Task started (task:start)',
          value: 'task:start',
          checked: current?.events.includes('task:start') ?? true,
        },
        {
          name: 'Task completed (task:done)',
          value: 'task:done',
          checked: current?.events.includes('task:done') ?? true,
        },
        {
          name: 'Task reviewed (task:review)',
          value: 'task:review',
          checked: current?.events.includes('task:review') ?? false,
        },
      ],
    },
  ]);

  if (selectedEvents.length === 0) {
    error('At least one event must be selected');
    return;
  }

  notifications.telegram = {
    botToken,
    chatId,
    events: selectedEvents as NotificationEvent[],
  };

  configManager.setNotifications(notifications);
  success('Telegram notification configured!');
  info(`Events: ${chalk.cyan(selectedEvents.join(', '))}`);
}
