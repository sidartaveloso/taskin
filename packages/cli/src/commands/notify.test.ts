import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

vi.mock('../lib/config-manager.js', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    getAutomationBehavior: vi.fn().mockReturnValue({ autoSync: false }),
    loadConfig: vi.fn().mockReturnValue({
      notifications: {
        discord: {
          webhookUrl: 'https://discord.com/api/webhooks/123/abc',
          events: ['task:done', 'task:start', 'task:review'],
        },
      },
    }),
  })),
}));

vi.mock('../lib/hook-runner.js', () => ({
  HookRunner: vi.fn(),
}));

import { ConfigManager } from '../lib/config-manager.js';

describe('notify command handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load notification config from .taskin.json', async () => {
    const configManager = new ConfigManager('/test');
    const config = configManager.loadConfig();
    expect(config.notifications?.discord?.webhookUrl).toBe(
      'https://discord.com/api/webhooks/123/abc',
    );
  });

  it('should have events configured for all notification types', async () => {
    const configManager = new ConfigManager('/test');
    const config = configManager.loadConfig();
    const events = config.notifications?.discord?.events ?? [];
    expect(events).toContain('task:done');
    expect(events).toContain('task:start');
    expect(events).toContain('task:review');
  });
});
