/**
 * `taskin config --commit-language` — task-207.
 *
 * Drives the real commander command so the flag, the validation and the
 * persisted file are all exercised the way a user would hit them.
 */

import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManager } from '../lib/config-manager.js';
import { configCommand } from './config.js';

vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: { prompt: vi.fn() },
}));

const testDir = join(process.cwd(), '.test-config-commit-language');
const configPath = join(testDir, '.taskin.json');

const runConfig = async (...args: string[]): Promise<void> => {
  const program = new Command();
  program.exitOverride();
  configCommand(program);
  await program.parseAsync(['node', 'taskin', 'config', ...args]);
};

const writeAutomation = (automation: Record<string, unknown>): void => {
  writeFileSync(
    configPath,
    JSON.stringify({ version: '1.0.13', automation, provider: { type: 'fs', config: {} } }, null, 2),
    'utf-8',
  );
};

describe('taskin config --commit-language', () => {
  let logged: string[];

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    writeAutomation({ level: 'assisted', autoSync: true, ciSkipTag: '[ci skip]' });
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);

    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it('is English when the project has not chosen', () => {
    expect(new ConfigManager(testDir).getCommitLanguage()).toBe('en');
  });

  it('persists Portuguese and keeps the rest of the automation block', async () => {
    await runConfig('--commit-language', 'pt-BR');

    expect(new ConfigManager(testDir).getCommitLanguage()).toBe('pt-BR');
    const written = JSON.parse(readFileSync(configPath, 'utf-8')) as { automation: Record<string, unknown> };
    expect(written.automation).toMatchObject({ level: 'assisted', ciSkipTag: '[ci skip]', commitLanguage: 'pt-BR' });
  });

  it('refuses a language it cannot write in', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runConfig('--commit-language', 'fr')).rejects.toThrow('exit');

    expect(exit).toHaveBeenCalledWith(1);
    expect(new ConfigManager(testDir).getCommitLanguage()).toBe('en');
  });

  it('falls back to English for an unknown value written by hand, keeping the other settings', () => {
    writeAutomation({ level: 'autopilot', autoSync: false, ciSkipTag: '[no ci]', commitLanguage: 'fr' });

    const behavior = new ConfigManager(testDir).getAutomationBehavior();

    expect(behavior.commitLanguage).toBe('en');
    expect(behavior.ciSkipTag).toBe('[no ci]');
    expect(behavior.autoCommitFinish).toBe(true);
  });

  it('shows the language under --show', async () => {
    await runConfig('--commit-language', 'pt-BR');
    logged = [];

    await runConfig('--show');

    expect(logged.join('\n')).toMatch(/Commit language: .*pt-BR/);
  });
});
