/**
 * Commander camel-cases dashed flags. `handleConfigCommand` used to read
 * `options['discord-webhook']`, so `--discord-webhook` never reached its
 * branch and fell through to the interactive prompt instead.
 */

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configCommand } from './config.js';

vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: { prompt: vi.fn() },
}));

const WEBHOOK_URL = 'https://discord.example/api/webhooks/1/abc';
const testDir = join(process.cwd(), '.test-config-option-keys');
const configPath = join(testDir, '.taskin.json');

const runConfig = async (...args: string[]): Promise<void> => {
  const program = new Command();
  program.exitOverride();
  configCommand(program);
  await program.parseAsync(['node', 'taskin', 'config', ...args]);
};

describe('taskin config flag parsing', () => {
  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify({ version: '1.0.13', provider: { type: 'fs', config: {} } }, null, 2),
      'utf-8',
    );
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it('reaches the Discord branch instead of the interactive prompt', async () => {
    await runConfig('--discord-webhook', WEBHOOK_URL);

    expect(inquirer.prompt).not.toHaveBeenCalled();

    const written = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      notifications?: { discord?: { webhookUrl: string; events: string[] } };
    };
    expect(written.notifications?.discord?.webhookUrl).toBe(WEBHOOK_URL);
  });

  it('passes --notification-events through to the Discord branch', async () => {
    await runConfig('--discord-webhook', WEBHOOK_URL, '--notification-events', 'task:review');

    const written = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      notifications?: { discord?: { events: string[] } };
    };
    expect(written.notifications?.discord?.events).toEqual(['task:review']);
  });
});
