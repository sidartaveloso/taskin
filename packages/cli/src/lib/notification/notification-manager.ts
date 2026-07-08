import type {
  INotificationProvider,
  NotificationEvent,
  NotificationMessage,
  NotificationResult,
} from '@opentask/taskin-types';

export interface NotificationOptions {
  event?: NotificationEvent;
}

export interface NotificationManagerConfig {
  eventFilter?: Record<string, NotificationEvent[]>;
}

export class NotificationManager {
  constructor(
    private providers: INotificationProvider[],
    private config?: NotificationManagerConfig,
  ) {}

  async notify(
    message: NotificationMessage,
    options?: NotificationOptions,
  ): Promise<NotificationResult[]> {
    const filtered = this.filterProviders(options?.event);
    const results = await Promise.all(
      filtered.map((provider) => provider.send(message)),
    );
    return results;
  }

  private filterProviders(event?: NotificationEvent): INotificationProvider[] {
    if (!event || !this.config?.eventFilter) {
      return this.providers;
    }

    return this.providers.filter((provider) => {
      const events = this.config.eventFilter![provider.name];
      return events?.includes(event) ?? true;
    });
  }
}
