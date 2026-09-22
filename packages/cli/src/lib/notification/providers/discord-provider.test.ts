import type { NotificationMessage } from '@opentask/taskin-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscordProvider } from './discord-provider.js';

interface SentDiscordBody {
  content?: string;
  embeds: Array<{
    title: string;
    color: number;
    fields: unknown[];
    footer: { text: string };
  }>;
}

describe('DiscordProvider', () => {
  let provider: DiscordProvider;
  const webhookUrl = 'https://discord.com/api/webhooks/123/abc';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new DiscordProvider(webhookUrl);
  });

  it('should have name "discord"', () => {
    expect(provider.name).toBe('discord');
  });

  it('should send a message successfully on 204', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('discord');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should fail on 4xx response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.provider).toBe('discord');
    expect(result.error).toContain('400');
  });

  it('should fail on 5xx response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('should handle network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should format embed message correctly', async () => {
    let sentBody!: SentDiscordBody;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = JSON.parse(opts.body as string) as SentDiscordBody;
      return { ok: true, status: 204 };
    });

    const message: NotificationMessage = {
      title: 'Task #020 — Notifications',
      description: 'Foi finalizada por **Sidarta Veloso**',
      color: 5763719,
      fields: [{ name: 'Status', value: 'pending → done', inline: true }],
      footer: { text: 'Taskin • task-020' },
    };

    await provider.send(message);
    expect(sentBody.embeds[0]?.title).toBe('Task #020 — Notifications');
    expect(sentBody.embeds[0]?.color).toBe(5763719);
    expect(sentBody.embeds[0]?.fields).toHaveLength(1);
    expect(sentBody.embeds[0]?.footer.text).toBe('Taskin • task-020');
  });

  it('should include content when message has mentions', async () => {
    let sentBody!: SentDiscordBody;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = JSON.parse(opts.body as string) as SentDiscordBody;
      return { ok: true, status: 204 };
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
      mentions: ['<@12345>', '<@67890>'],
    };

    await provider.send(message);
    expect(sentBody.content).toContain('<@12345>');
    expect(sentBody.content).toContain('<@67890>');
  });

  it('should handle fetch throwing TypeError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toContain('fetch failed');
  });

  it('should handle non-Error rejection (string)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('string error');

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });

  it('should handle empty mentions array', async () => {
    let sentBody!: SentDiscordBody;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = JSON.parse(opts.body as string) as SentDiscordBody;
      return { ok: true, status: 204 };
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
      mentions: [],
    };

    await provider.send(message);
    // Should not add content field when mentions is empty
    expect(sentBody.content).toBeUndefined();
  });
});
