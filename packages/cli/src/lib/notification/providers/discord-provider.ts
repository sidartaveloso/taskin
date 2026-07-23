import type { INotificationProvider, NotificationMessage, NotificationResult } from '@opentask/taskin-types';

export class DiscordProvider implements INotificationProvider {
  readonly name = 'discord';

  constructor(private webhookUrl: string) {}

  async send(message: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      const body: Record<string, unknown> = {
        embeds: [
          {
            title: message.title,
            description: message.description,
            color: message.color,
            fields: message.fields,
            footer: message.footer,
          },
        ],
      };

      if (message.mentions && message.mentions.length > 0) {
        body.content = message.mentions.join(' ');
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: `Discord webhook responded with ${response.status}: ${response.statusText}`,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        provider: this.name,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }
}
