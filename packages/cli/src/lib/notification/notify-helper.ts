import type { INotificationProvider, NotificationEvent, NotificationMessage } from '@opentask/taskin-types';
import { execSync } from 'child_process';
import type { ConfigManager } from '../config-manager.js';
import { resolveEnvVars } from './env-resolver.js';
import { NotificationManager } from './notification-manager.js';
import { NotificationMessageBuilder } from './notification-message-builder.js';
import { ConsoleProvider } from './providers/console-provider.js';
import { DiscordProvider } from './providers/discord-provider.js';
import { TelegramProvider } from './providers/telegram-provider.js';

interface GitInfo {
  branch: string;
  commitCount: number;
  lastCommitHash: string;
}

function getGitInfo(cwd: string): GitInfo | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    const commitCount = parseInt(
      execSync('git rev-list --count HEAD', {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim(),
      10,
    );

    // Count commits only for this task branch (since branching off main/develop)
    const lastCommitHash = execSync('git rev-parse --short HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    return { branch, commitCount, lastCommitHash };
  } catch {
    return null;
  }
}

export async function sendTaskNotification(
  configManager: ConfigManager,
  event: NotificationEvent,
  taskId: string,
  taskTitle?: string,
  cwd?: string,
): Promise<void> {
  try {
    const config = configManager.loadConfig();
    if (!config.notifications) return;

    const builder = new NotificationMessageBuilder();
    const message: NotificationMessage = builder
      .setTitle(`Task #${taskId}${taskTitle ? ` — ${taskTitle}` : ''}`)
      .setDescription(`Evento: **${event}**`)
      .setColor(5763719)
      .addField('Event', event)
      .addField('Task', taskId)
      .build();

    const autoSync = config.automation?.autoSync ?? true;
    if (autoSync) {
      const gitInfo = getGitInfo(cwd ?? process.cwd());
      if (gitInfo) {
        message.fields?.push(
          { name: 'Branch', value: gitInfo.branch, inline: true },
          { name: 'Commits', value: `${gitInfo.commitCount} (auto-sync)`, inline: true },
          { name: 'Hash', value: gitInfo.lastCommitHash, inline: true },
        );
      }
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

    const eventFilter: Record<string, NotificationEvent[]> = {};
    if (config.notifications.discord) {
      eventFilter.discord = config.notifications.discord.events as NotificationEvent[];
    }
    if (config.notifications.telegram) {
      eventFilter.telegram = config.notifications.telegram.events as NotificationEvent[];
    }

    const manager = new NotificationManager(providers, { eventFilter });
    await manager.notify(message, { event });
  } catch {
    // Silently ignore notification errors in lifecycle hooks
  }
}
