import type { NotificationEvent } from '@opentask/taskin-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigManager } from '../config-manager.js';
import { sendTaskNotification } from './notify-helper.js';

function fakeConfigManager(notifications: unknown): ConfigManager {
  return {
    loadConfig: () => ({ notifications }),
  } as unknown as ConfigManager;
}

const discordConfig = {
  discord: {
    webhookUrl: 'https://discord.com/api/webhooks/123/abc',
    events: ['task:done'] as NotificationEvent[],
  },
};

describe('sendTaskNotification', () => {
  let printed: string[] = [];

  beforeEach(() => {
    printed = [];
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      printed.push(String(message));
    });
  });

  afterEach(() => {
    delete process.env.TASKIN_DEBUG;
    vi.restoreAllMocks();
  });

  function debugLines(): string[] {
    return printed.filter((line) => line.includes('⚠'));
  }

  it('should never throw when a provider fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });

    await expect(sendTaskNotification(fakeConfigManager(discordConfig), 'task:done', '020')).resolves.toBeUndefined();
  });

  it('should stay quiet about a failed provider when debug is off', async () => {
    delete process.env.TASKIN_DEBUG;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });

    await sendTaskNotification(fakeConfigManager(discordConfig), 'task:done', '020');

    expect(debugLines()).toHaveLength(0);
  });

  it('should report a failed provider when debug is on', async () => {
    process.env.TASKIN_DEBUG = '1';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });

    await sendTaskNotification(fakeConfigManager(discordConfig), 'task:done', '020');

    const lines = debugLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('discord');
    expect(lines[0]).toContain('401');
  });

  it('should report a thrown error when debug is on', async () => {
    process.env.TASKIN_DEBUG = '1';
    const broken = {
      loadConfig: () => {
        throw new Error('config is corrupt');
      },
    } as unknown as ConfigManager;

    await sendTaskNotification(broken, 'task:done', '020');

    const lines = debugLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('config is corrupt');
  });

  it('should not print the console box on a lifecycle command', async () => {
    delete process.env.TASKIN_DEBUG;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

    await sendTaskNotification(fakeConfigManager(discordConfig), 'task:done', '020');

    // A caixa do ConsoleProvider tem uma moldura; nada dela deve sair
    expect(printed.some((line) => line.includes('Notification'))).toBe(false);
  });

  it('should print the console box when debug is on', async () => {
    process.env.TASKIN_DEBUG = '1';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

    await sendTaskNotification(fakeConfigManager(discordConfig), 'task:done', '020');

    expect(printed.some((line) => line.includes('Notification'))).toBe(true);
  });

  it('should do nothing when notifications are not configured', async () => {
    process.env.TASKIN_DEBUG = '1';
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    await sendTaskNotification(fakeConfigManager(undefined), 'task:done', '020');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(debugLines()).toHaveLength(0);
  });
});
