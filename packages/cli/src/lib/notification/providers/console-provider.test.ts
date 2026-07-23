import type { NotificationMessage } from '@opentask/taskin-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleProvider } from './console-provider.js';

describe('ConsoleProvider', () => {
  let provider: ConsoleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ConsoleProvider();
  });

  it('should have name "console"', () => {
    expect(provider.name).toBe('console');
  });

  it('should log notification to console with colors by default', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('console');
    expect(consoleLog).toHaveBeenCalled();
  });

  it('should log notification as JSON with --json flag', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const jsonProvider = new ConsoleProvider({ json: true });

    const message: NotificationMessage = {
      title: 'Task #020',
      description: 'Task completed',
      color: 5763719,
    };

    const result = await jsonProvider.send(message);
    expect(result.success).toBe(true);

    const lastCall = consoleLog.mock.calls[0][0];
    const parsed = JSON.parse(lastCall);
    expect(parsed.title).toBe('Task #020');
    expect(parsed.description).toBe('Task completed');
  });

  it('should always succeed even with minimal message', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const message: NotificationMessage = {
      title: 'Minimal',
      description: 'Just a test',
    };

    const result = await provider.send(message);
    expect(result.success).toBe(true);
  });
});
