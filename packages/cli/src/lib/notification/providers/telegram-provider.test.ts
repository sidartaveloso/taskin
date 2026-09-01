import type { NotificationMessage } from '@opentask/taskin-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramProvider } from './telegram-provider.js';

describe('TelegramProvider', () => {
  let provider: TelegramProvider;
  const botToken = '123456:ABC-DEF1234ghIkl';
  const chatId = '-1001234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new TelegramProvider(botToken, chatId);
  });

  it('should have name "telegram"', () => {
    expect(provider.name).toBe('telegram');
  });

  it('should send a message successfully on 200 with ok:true', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('telegram');
  });

  it('should fail on API returning ok:false', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: false, description: 'Bad request' }),
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Bad request');
  });

  it('should fail on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(false);
    expect(result.error).toContain('401');
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

  it('should format message as MarkdownV2', async () => {
    let callUrl = '';
    let sentBody: URLSearchParams | null = null;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: RequestInit) => {
      callUrl = url;
      sentBody = opts.body as URLSearchParams;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      };
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed by *Sidarta*',
    };

    await provider.send(message);
    expect(callUrl).toContain(`bot${botToken}/sendMessage`);
    expect((sentBody as URLSearchParams | null)?.get('chat_id')).toBe(chatId);
    expect((sentBody as URLSearchParams | null)?.get('parse_mode')).toBe('MarkdownV2');
  });

  it('should format title and description into message text', async () => {
    let sentBody: URLSearchParams | null = null;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = opts.body as URLSearchParams;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      };
    });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
      fields: [{ name: 'Status', value: 'done', inline: true }],
    };

    await provider.send(message);
    const text = (sentBody as URLSearchParams | null)?.get('text') ?? '';
    expect(text).toContain('Task');
    expect(text).toContain('020');
    expect(text).toContain('Task completed');
    expect(text).toContain('Status');
    expect(text).toContain('done');
  });

  it('should escape Telegram MarkdownV2 special characters in title', async () => {
    let sentBody: URLSearchParams | null = null;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = opts.body as URLSearchParams;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      };
    });

    const message: NotificationMessage = {
      title: 'Task _*[]()~`>#+-=|{}.! & 100%',
      description: 'Cost: R$ 50,00 (test)',
    };

    await provider.send(message);
    const text = (sentBody as URLSearchParams | null)?.get('text') ?? '';
    // All special chars should be escaped with backslash
    expect(text).toContain('\\_');
    expect(text).toContain('\\*');
    expect(text).toContain('\\[');
    expect(text).toContain('\\`');
    expect(text).toContain('\\#');
    expect(text).toContain('\\!');
    // Normal chars should not be escaped
    expect(text).toContain('&');
    expect(text).toContain('100');
  });

  it('should handle message with only fields (no title)', async () => {
    let sentBody: URLSearchParams | null = null;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      sentBody = opts.body as URLSearchParams;
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      };
    });

    const message: NotificationMessage = {
      title: '',
      description: '',
      fields: [{ name: 'Status', value: 'done' }],
    };

    await provider.send(message);
    const text = (sentBody as URLSearchParams | null)?.get('text') ?? '';
    expect(text).toContain('Status');
    expect(text).toContain('done');
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
});
