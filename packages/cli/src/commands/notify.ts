import type { INotificationProvider, NotificationMessage } from '@opentask/taskin-types';
import { error, info, printHeader, success } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { resolveEnvVars } from '../lib/notification/env-resolver.js';
import { NotificationManager } from '../lib/notification/notification-manager.js';
import { NotificationMessageBuilder } from '../lib/notification/notification-message-builder.js';
import { DiscordProvider } from '../lib/notification/providers/discord-provider.js';
import { TelegramProvider } from '../lib/notification/providers/telegram-provider.js';
import { ConsoleProvider } from '../lib/notification/providers/console-provider.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface NotifyOptions {
  event?: string;
  'task-id'?: string;
  title?: string;
  description?: string;
  dryRun?: boolean;
}

export const notifyCommand = defineCommand({
  name: 'notify',
  description: '📬 Send notification for task events',
  options: [
    {
      flags: '--event <event>',
      description: 'Notification event (task:start, task:done, task:review)',
    },
    {
      flags: '--task-id <taskId>',
      description: 'Task ID to include in notification',
    },
    {
      flags: '--title <title>',
      description: 'Custom notification title',
    },
    {
      flags: '--description <description>',
      description: 'Custom notification description',
    },
    {
      flags: '--dry-run',
      description: 'Only show notification, do not send',
    },
  ],
  handler: async (options: NotifyOptions) => {
    await notifyTask(options);
  },
});

async function notifyTask(options: NotifyOptions): Promise<void> {
  requireTaskinProject();

  const monorepoRoot = process.cwd();
  const configManager = new ConfigManager(monorepoRoot);
  const config = configManager.loadConfig();

  if (!config.notifications) {
    info('No notification providers configured. Set up "notifications" in .taskin.json');
    return;
  }

  const event = options.event as 'task:start' | 'task:done' | 'task:review' | undefined;
  const title = options.title ?? `Task ${options['task-id'] ?? ''}`;
  const description = options.description ?? 'Notification from Taskin';

  const builder = new NotificationMessageBuilder();
  const message: NotificationMessage = builder
    .setTitle(title)
    .setDescription(description)
    .setColor(5763719)
    .addField('Event', event ?? 'manual')
    .build();

  if (options.dryRun) {
    printHeader('Notification (dry run)', '📬');
    info(`Title: ${message.title}`);
    info(`Description: ${message.description}`);
    info(`Event: ${event ?? 'manual'}`);

    if (config.notifications.discord) {
      info('Would send to Discord');
    }
    if (config.notifications.telegram) {
      info('Would send to Telegram');
    }

    success('Dry run complete');
    return;
  }

  const providers: INotificationProvider[] = [];

  if (config.notifications.discord) {
    const webhookUrl = resolveEnvVars(config.notifications.discord.webhookUrl);
    providers.push(new DiscordProvider(webhookUrl));
  }

  if (config.notifications.telegram) {
    const botToken = resolveEnvVars(config.notifications.telegram.botToken);
    const chatId = resolveEnvVars(config.notifications.telegram.chatId);
    providers.push(new TelegramProvider(botToken, chatId));
  }

  providers.push(new ConsoleProvider());

  const eventFilter: Record<string, string[]> = {};
  if (config.notifications.discord) {
    eventFilter.discord = config.notifications.discord.events as string[];
  }
  if (config.notifications.telegram) {
    eventFilter.telegram = config.notifications.telegram.events as string[];
  }

  const manager = new NotificationManager(providers, { eventFilter });
  const results = await manager.notify(message, event ? { event } : undefined);

  for (const result of results) {
    if (result.success) {
      success(`${result.provider}: sent (${result.duration}ms)`);
    } else {
      error(`${result.provider}: failed - ${result.error} (${result.duration}ms)`);
    }
  }
}
