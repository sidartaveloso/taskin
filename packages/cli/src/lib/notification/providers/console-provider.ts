import type { INotificationProvider, NotificationMessage, NotificationResult } from '@opentask/taskin-types';
import { colors } from '../../colors.js';

export interface ConsoleProviderOptions {
  json?: boolean;
}

export class ConsoleProvider implements INotificationProvider {
  readonly name = 'console';

  constructor(private options?: ConsoleProviderOptions) {}

  async send(message: NotificationMessage): Promise<NotificationResult> {
    const startTime = Date.now();

    if (this.options?.json) {
      console.log(JSON.stringify(message, null, 2));
    } else {
      console.log('');
      console.log(colors.secondary('┌─ Notification ──────────────────────────'));
      console.log(colors.highlight(`  ${message.title}`));
      console.log(colors.secondary(`  ${message.description}`));

      if (message.fields && message.fields.length > 0) {
        for (const field of message.fields) {
          console.log(colors.secondary(`  • ${field.name}: ${field.value}`));
        }
      }

      if (message.footer) {
        console.log(colors.secondary(`  ─ ${message.footer.text}`));
      }

      console.log(colors.secondary('└──────────────────────────────────────────'));
      console.log('');
    }

    return {
      success: true,
      provider: this.name,
      duration: Date.now() - startTime,
    };
  }
}
