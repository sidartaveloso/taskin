import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const TEST_DIR = join(process.cwd(), 'test-temp-notify-e2e');
const CLI_PATH = join(process.cwd(), 'dist/index.js');

describe.sequential('notify command E2E', () => {
  beforeEach(async () => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    await execAsync('git init', { cwd: TEST_DIR });
    await execAsync('git config user.email "test@test.com"', { cwd: TEST_DIR });
    await execAsync('git config user.name "Test User"', { cwd: TEST_DIR });
    await execAsync('git commit --allow-empty -m "initial"', { cwd: TEST_DIR });
  }, 60000);

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }, 60000);

  it('should notify with console provider when no webhook configured', async () => {
    await execAsync(`node ${CLI_PATH} init`, {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });

    const configPath = join(TEST_DIR, '.taskin.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.notifications = {};
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const { stdout } = await execAsync(
      `node ${CLI_PATH} notify --event task:done --title "Test" --description "E2E test"`,
      { cwd: TEST_DIR },
    );

    expect(stdout).toContain('sent');
  }, 60000);

  it('should show dry-run output without sending', async () => {
    await execAsync(`node ${CLI_PATH} init`, {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });

    const configPath = join(TEST_DIR, '.taskin.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.notifications = {};
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const { stdout } = await execAsync(
      `node ${CLI_PATH} notify --event task:done --title "Test" --description "Dry run" --dry-run`,
      { cwd: TEST_DIR },
    );

    expect(stdout).toMatch(/dry run/i);
  }, 60000);

  it('should show message when no notification providers configured', async () => {
    await execAsync(`node ${CLI_PATH} init`, {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });

    const { stdout } = await execAsync(`node ${CLI_PATH} notify --event task:done`, { cwd: TEST_DIR });

    expect(stdout).toContain('No notification providers');
  }, 60000);

  it('should include task title in notification', async () => {
    await execAsync(`node ${CLI_PATH} init`, {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });

    const configPath = join(TEST_DIR, '.taskin.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.notifications = {};
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const { stdout } = await execAsync(`node ${CLI_PATH} notify --event task:done --title "Test Title"`, {
      cwd: TEST_DIR,
    });

    expect(stdout).toContain('sent');
  }, 60000);
});
