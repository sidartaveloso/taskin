import type { IChannelSenderPort } from '@opentask/taskin-situation';
import type { INotificationProvider, NotificationConfig } from '@opentask/taskin-types';
import { resolveEnvVars } from './env-resolver.js';
import { NotificationMessageBuilder } from './notification-message-builder.js';
import { ConsoleProvider } from './providers/console-provider.js';
import { DiscordProvider } from './providers/discord-provider.js';
import { TelegramProvider } from './providers/telegram-provider.js';

const NOTICE_COLOR = 5763719;

/**
 * Os provedores que um canal pode usar: o `console` sempre existe; `discord` e
 * `telegram` existem quando as `notifications` os configuram. Webhook e token
 * so passam por aqui, em memoria: nunca viram texto de aviso.
 */
export function providersFromConfig(notifications: NotificationConfig | undefined): INotificationProvider[] {
  const providers: INotificationProvider[] = [new ConsoleProvider()];
  if (notifications?.discord) {
    providers.push(new DiscordProvider(resolveEnvVars(notifications.discord.webhookUrl)));
  }
  if (notifications?.telegram) {
    providers.push(
      new TelegramProvider(
        resolveEnvVars(notifications.telegram.botToken),
        resolveEnvVars(notifications.telegram.chatId),
      ),
    );
  }
  return providers;
}

/** Um canal por provedor, pelo nome. Canal sem provedor, provedor que falha ou lanca: recusa (`false`). */
export function createChannelSender(providers: readonly INotificationProvider[]): IChannelSenderPort {
  return {
    async send(channel, notice) {
      const provider = providers.find((p) => p.name === channel);
      if (provider === undefined) return false;
      try {
        const builder = new NotificationMessageBuilder()
          .setTitle(notice.subject)
          .setDescription(notice.body)
          .setColor(NOTICE_COLOR);
        if (notice.link !== undefined) builder.addField('Link', notice.link);
        const result = await provider.send(builder.build());
        return result.success;
      } catch {
        return false;
      }
    },
  };
}
