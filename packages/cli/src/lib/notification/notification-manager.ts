import type {
  INotificationProvider,
  NotificationEvent,
  NotificationMessage,
  NotificationProviderName,
  NotificationResult,
} from '@opentask/taskin-types';

export interface NotificationOptions {
  event?: NotificationEvent;
}

export interface NotificationManagerConfig {
  /**
   * Which events each channel wants. A channel with no entry gets everything —
   * that is how the console provider stays a firehose. `Partial` is the point:
   * the lookup below really can miss, and the type has to say so.
   */
  eventFilter?: Partial<Record<NotificationProviderName, NotificationEvent[]>>;
}

export class NotificationManager {
  constructor(
    private providers: INotificationProvider[],
    private config?: NotificationManagerConfig,
  ) {}

  async notify(message: NotificationMessage, options?: NotificationOptions): Promise<NotificationResult[]> {
    const filtered = this.filterProviders(options?.event);
    const results = await Promise.all(filtered.map((provider) => provider.send(message)));
    return results;
  }

  private filterProviders(event?: NotificationEvent): INotificationProvider[] {
    const eventFilter = this.config?.eventFilter;
    if (!event || !eventFilter) {
      return this.providers;
    }

    return this.providers.filter((provider) => {
      const events = eventFilter[provider.name];
      return events?.includes(event) ?? true;
    });
  }
}
