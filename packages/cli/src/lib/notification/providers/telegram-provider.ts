import type { INotificationProvider, NotificationMessage, NotificationResult } from '@opentask/taskin-types';

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}!.]/g, '\\$&');
}

function formatMessage(message: NotificationMessage): string {
  const parts: string[] = [];

  if (message.title) {
    parts.push(`*${escapeMarkdown(message.title)}*`);
  }

  if (message.description) {
    parts.push(escapeMarkdown(message.description));
  }

  if (message.fields && message.fields.length > 0) {
    const fieldLines = message.fields.map((f) => `*${escapeMarkdown(f.name)}:* ${escapeMarkdown(f.value)}`);
    parts.push(fieldLines.join('\n'));
  }

  if (message.footer) {
    parts.push(`_${escapeMarkdown(message.footer.text)}_`);
  }

  return parts.join('\n\n');
}

export class TelegramProvider implements INotificationProvider {
  readonly name = 'telegram';

  constructor(
    private botToken: string,
    private chatId: string,
  ) {}

  async send(message: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      const text = formatMessage(message);
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const body = new URLSearchParams({
        chat_id: this.chatId,
        text,
        parse_mode: 'MarkdownV2',
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          error: `Telegram API responded with ${response.status}: ${response.statusText}`,
          duration: Date.now() - startTime,
        };
      }

      const result = (await response.json()) as { ok: boolean; description?: string };

      if (!result.ok) {
        return {
          success: false,
          provider: this.name,
          error: `Telegram API error: ${result.description ?? 'Unknown error'}`,
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
