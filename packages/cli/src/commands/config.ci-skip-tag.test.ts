/**
 * `taskin config --ci-skip-tag` — task-052.
 *
 * Drives the real commander command so the flag, the validation and the
 * persisted file are all exercised the way a user would hit them.
 */

import { Command } from 'commander';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
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

const repoCwd = process.cwd();
const testDir = join(repoCwd, '.test-config-ci-skip-tag');
const configPath = join(testDir, '.taskin.json');

const runConfig = async (...args: string[]): Promise<void> => {
  const program = new Command();
  program.exitOverride();
  configCommand(program);
  await program.parseAsync(['node', 'taskin', 'config', ...args]);
};

describe('taskin config --ci-skip-tag', () => {
  let logged: string[];

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify(
        { version: '1.0.13', automation: { level: 'assisted', autoSync: true }, provider: { type: 'fs', config: {} } },
        null,
        2,
      ),
      'utf-8',
    );
    // `process.chdir` is unavailable in vitest workers, and the command reads
    // the project root from `process.cwd()`.
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

  it('persists a documented tag', async () => {
    await runConfig('--ci-skip-tag', '[ci skip]');

    expect(new ConfigManager(testDir).getCiSkipTag()).toBe('[ci skip]');
  });

  it('accepts "none" as the way to ask for CI to run', async () => {
    await runConfig('--ci-skip-tag', 'none');

    expect(new ConfigManager(testDir).getCiSkipTag()).toBe('');
  });

  it('accepts an undocumented tag for a custom pipeline', async () => {
    await runConfig('--ci-skip-tag', '***NO_CI***');

    expect(new ConfigManager(testDir).getCiSkipTag()).toBe('***NO_CI***');
  });

  it('warns when the tag is not one the platforms document', async () => {
    await runConfig('--ci-skip-tag', '***NO_CI***');

    expect(logged.join('\n')).toMatch(/GitHub|GitLab|Bitbucket/);
  });

  it('does not warn about a documented tag', async () => {
    await runConfig('--ci-skip-tag', '[no ci]');

    expect(logged.join('\n')).not.toMatch(/GitHub, GitLab/);
  });

  it('names the hyphenated form explicitly, since that was the defect', async () => {
    await runConfig('--ci-skip-tag', '[skip-ci]');

    expect(logged.join('\n')).toContain('[skip-ci]');
    expect(logged.join('\n')).toContain('[skip ci]');
  });

  it('still persists the hyphenated form, because the warning is advice not a veto', async () => {
    await runConfig('--ci-skip-tag', '[skip-ci]');

    expect(new ConfigManager(testDir).getCiSkipTag()).toBe('[skip-ci]');
  });

  it('shows the effective tag under --show', async () => {
    await runConfig('--ci-skip-tag', '[ci skip]');
    logged = [];

    await runConfig('--show');

    expect(logged.join('\n')).toContain('[ci skip]');
  });

  it('describes an empty tag under --show instead of printing nothing', async () => {
    await runConfig('--ci-skip-tag', 'none');
    logged = [];

    await runConfig('--show');

    expect(logged.join('\n')).toMatch(/no tag/i);
  });
});
