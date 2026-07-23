import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDotEnv, resolveEnvVars } from './env-resolver.js';

describe('resolveEnvVars', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return the string as-is when no env vars', () => {
    expect(resolveEnvVars('https://example.com/webhook')).toBe('https://example.com/webhook');
  });

  it('should resolve a single env var', () => {
    process.env.TEST_URL = 'https://discord.com/api/webhooks/123/abc';
    expect(resolveEnvVars('${TEST_URL}')).toBe('https://discord.com/api/webhooks/123/abc');
  });

  it('should resolve env var in URL path', () => {
    process.env.TOKEN = 'abc123';
    expect(resolveEnvVars('https://api.telegram.org/bot${TOKEN}/sendMessage')).toBe(
      'https://api.telegram.org/botabc123/sendMessage',
    );
  });

  it('should resolve multiple env vars', () => {
    process.env.BOT_TOKEN = '123:ABC';
    process.env.CHAT_ID = '-100123';
    expect(resolveEnvVars('${BOT_TOKEN}:${CHAT_ID}')).toBe('123:ABC:-100123');
  });

  it('should return empty string for unresolved env var', () => {
    expect(resolveEnvVars('${UNSET_VAR}')).toBe('');
  });

  it('should replace unresolved var with empty string in mixed content', () => {
    expect(resolveEnvVars('prefix-${UNSET_VAR}-suffix')).toBe('prefix--suffix');
  });

  it('should handle empty string', () => {
    expect(resolveEnvVars('')).toBe('');
  });

  it('should handle string without dollar sign', () => {
    expect(resolveEnvVars('plain-text')).toBe('plain-text');
  });
});

describe('loadDotEnv', () => {
  const originalEnv = process.env;
  let tmpDir: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    tmpDir = mkdtempSync(join(tmpdir(), 'taskin-env-test-'));
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should load vars from .env file', () => {
    writeFileSync(join(tmpDir, '.env'), 'DISCORD_WEBHOOK=https://discord.com/webhook/abc\nTELEGRAM_TOKEN=123:ABC');
    loadDotEnv(tmpDir);
    expect(process.env.DISCORD_WEBHOOK).toBe('https://discord.com/webhook/abc');
    expect(process.env.TELEGRAM_TOKEN).toBe('123:ABC');
  });

  it('should not override existing env vars', () => {
    process.env.EXISTING = 'original';
    writeFileSync(join(tmpDir, '.env'), 'EXISTING=overridden\nNEW_VAR=ok');
    loadDotEnv(tmpDir);
    expect(process.env.EXISTING).toBe('original');
    expect(process.env.NEW_VAR).toBe('ok');
  });

  it('should strip quotes from values', () => {
    writeFileSync(join(tmpDir, '.env'), 'URL="https://example.com"\nTOKEN=\'abc123\'');
    loadDotEnv(tmpDir);
    expect(process.env.URL).toBe('https://example.com');
    expect(process.env.TOKEN).toBe('abc123');
  });

  it('should ignore comments and blank lines', () => {
    writeFileSync(join(tmpDir, '.env'), '# comment\n\nKEY=value\n# another comment');
    loadDotEnv(tmpDir);
    expect(process.env.KEY).toBe('value');
  });

  it('should not throw if .env does not exist', () => {
    expect(() => loadDotEnv(tmpDir)).not.toThrow();
  });
});
