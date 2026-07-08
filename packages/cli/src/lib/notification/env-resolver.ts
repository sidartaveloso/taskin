import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENV_VAR_PATTERN = /\$\{([^}]+)\}/g;

/**
 * Load .env file from cwd into process.env.
 * Does NOT override existing env vars.
 */
export function loadDotEnv(dir?: string): void {
  try {
    const envPath = join(dir ?? process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file is optional
  }
}

/**
 * Resolve ${VAR_NAME} patterns in a string with environment variables.
 * Unresolved variables resolve to empty string, causing the provider
 * to fail gracefully with a clear error.
 */
export function resolveEnvVars(value: string): string {
  return value.replace(ENV_VAR_PATTERN, (_match, varName: string) => {
    return process.env[varName] ?? '';
  });
}
