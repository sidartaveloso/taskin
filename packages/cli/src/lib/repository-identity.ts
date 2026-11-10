import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { type RepositoryIdentity, resolveRepositoryIdentity } from '@opentask/taskin-situation';

function readJson(file: string): Record<string, unknown> {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function originOf(root: string): string | undefined {
  try {
    const url = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
    return url.trim() === '' ? undefined : url.trim();
  } catch {
    return undefined;
  }
}

function releasesIn(personal: Record<string, unknown>): string[] {
  return Object.values(personal)
    .filter((entries): entries is { releasedTo?: string[] }[] => Array.isArray(entries))
    .flatMap((entries) => entries.flatMap((e) => e.releasedTo ?? []));
}

/** Os dois ids do repositorio em `root`: o do historico e o de confianca. */
export function repositoryIdentityOf(
  root: string,
  repositoryConfig: string,
  personalResources: string,
): RepositoryIdentity {
  const { resources } = readJson(repositoryConfig) as { resources?: { repository?: unknown } };
  const remote = originOf(root);
  return resolveRepositoryIdentity({
    folder: path.basename(root),
    location: realpathSync(root),
    ...(resources?.repository !== undefined && { declared: resources.repository }),
    ...(remote !== undefined && { remote }),
    releasedTo: releasesIn(readJson(personalResources)),
  });
}

const warned = new Set<string>();

/** Cada aviso uma vez por processo, em stderr: quem le o JSON da saida nao o ve. */
export function warnOnce(warnings: readonly string[]): void {
  for (const warning of warnings) {
    if (warned.has(warning)) continue;
    warned.add(warning);
    console.error(`Warning: ${warning}`);
  }
}
