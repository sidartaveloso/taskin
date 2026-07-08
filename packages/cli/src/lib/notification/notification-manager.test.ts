import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotificationManager } from './notification-manager.js';
import type {
  INotificationProvider,
  NotificationMessage,
} from '@opentask/taskin-types';

function createMockProvider(name: string): INotificationProvider {
  return {
    name,
    send: vi.fn().mockResolvedValue({
      success: true,
      provider: name,
      duration: 100,
    }),
  };
}

describe('NotificationManager', () => {
  let manager: NotificationManager;
  let discordMock: INotificationProvider;
  let telegramMock: INotificationProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    discordMock = createMockProvider('discord');
    telegramMock = createMockProvider('telegram');
  });

  it('should send to all providers', async () => {
    manager = new NotificationManager([discordMock, telegramMock]);
    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    const results = await manager.notify(message);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should filter providers by event', async () => {
    manager = new NotificationManager([discordMock, telegramMock], {
      eventFilter: {
        discord: ['task:done'],
        telegram: ['task:start'],
      },
    });

    await manager.notify(
      { title: 'Test', description: 'Test' },
      { event: 'task:done' },
    );

    expect(discordMock.send).toHaveBeenCalledTimes(1);
    expect(telegramMock.send).not.toHaveBeenCalled();
  });

  it('should include provider when event matches', async () => {
    manager = new NotificationManager([discordMock, telegramMock], {
      eventFilter: {
        discord: ['task:done'],
        telegram: ['task:done'],
      },
    });

    await manager.notify(
      { title: 'Test', description: 'Test' },
      { event: 'task:done' },
    );

    expect(discordMock.send).toHaveBeenCalledTimes(1);
    expect(telegramMock.send).toHaveBeenCalledTimes(1);
  });

  it('should handle partial failure', async () => {
    const failingProvider: INotificationProvider = {
      name: 'failing',
      send: vi.fn().mockResolvedValue({
        success: false,
        provider: 'failing',
        error: 'Failed',
        duration: 100,
      }),
    };

    manager = new NotificationManager([discordMock, failingProvider]);
    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    const results = await manager.notify(message);
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
  });

  it('should handle empty provider list', async () => {
    manager = new NotificationManager([]);
    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    const results = await manager.notify(message);
    expect(results).toEqual([]);
  });

  it('should send messages in parallel', async () => {
    let concurrentCalls = 0;
    let maxConcurrent = 0;

    const slowProvider: INotificationProvider = {
      name: 'slow',
      send: vi.fn().mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise((r) => setTimeout(r, 50));
        concurrentCalls--;
        return { success: true, provider: 'slow', duration: 50 };
      }),
    };

    manager = new NotificationManager([slowProvider, slowProvider, slowProvider]);
    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    await manager.notify(message);
    expect(maxConcurrent).toBeGreaterThan(1);
  });

  it('should handle provider that throws exception', async () => {
    const throwingProvider: INotificationProvider = {
      name: 'throws',
      send: vi.fn().mockRejectedValue(new Error('Unexpected error')),
    };

    manager = new NotificationManager([throwingProvider]);
    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    // The manager wraps the send in Promise.all, and the rejection
    // will propagate since we don't catch inside notify()
    await expect(manager.notify(message)).rejects.toThrow('Unexpected error');
  });

  it('should handle duplicate providers', async () => {
    const mockProvider = createMockProvider('discord');
    manager = new NotificationManager([mockProvider, mockProvider]);

    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    const results = await manager.notify(message);
    expect(results).toHaveLength(2);
    expect(mockProvider.send).toHaveBeenCalledTimes(2);
  });

  it('should not filter providers without event filter config', async () => {
    manager = new NotificationManager([discordMock, telegramMock]);

    await manager.notify(
      { title: 'Test', description: 'Test' },
      { event: 'task:done' },
    );

    expect(discordMock.send).toHaveBeenCalledTimes(1);
    expect(telegramMock.send).toHaveBeenCalledTimes(1);
  });

  it('should send to all providers when no event specified', async () => {
    manager = new NotificationManager([discordMock, telegramMock], {
      eventFilter: {
        discord: ['task:done'],
        telegram: ['task:start'],
      },
    });

    const message: NotificationMessage = {
      title: 'Test',
      description: 'Test message',
    };

    const results = await manager.notify(message);
    expect(results).toHaveLength(2);
  });
});
