import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/*
 * Mover arquivo preservando o historico quando da. Nasceu dentro de
 * `users-file-location.ts`, para a migracao do registro de usuarios (task-085),
 * e saiu para ca quando o renome dos arquivos de task passou a precisar da
 * mesma regra (task-140): uma so, para as duas.
 */

/** Roda um comando git; `true` quando saiu com sucesso. Nunca lanca. */
export function git(projectRoot: string, args: string[]): boolean {
  try {
    execFileSync('git', args, { cwd: projectRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isGitWorkTree(projectRoot: string): boolean {
  return git(projectRoot, ['rev-parse', '--is-inside-work-tree']);
}

export function isTrackedByGit(projectRoot: string, filePath: string): boolean {
  return git(projectRoot, ['ls-files', '--error-unmatch', '--', filePath]);
}

export function isIgnoredByGit(projectRoot: string, filePath: string): boolean {
  return git(projectRoot, ['check-ignore', '--quiet', '--', filePath]);
}

export function gitMove(projectRoot: string, from: string, to: string): boolean {
  return git(projectRoot, ['mv', '--', from, to]);
}

/**
 * Move o arquivo preservando o histórico quando possível.
 *
 * `git mv` é preferido para arquivo versionado: o Git registra a renomeação (o
 * histórico do registro de usuários não recomeça do zero) e já deixa a mudança
 * staged. Projeto sem Git, ou arquivo não versionado/ignorado, cai no rename
 * do sistema de arquivos — a migração não pode depender de Git.
 */
export async function moveFile(projectRoot: string, from: string, to: string): Promise<{ viaGit: boolean }> {
  await fs.mkdir(path.dirname(to), { recursive: true });

  if (isTrackedByGit(projectRoot, from) && gitMove(projectRoot, from, to)) {
    return { viaGit: true };
  }

  await fs.rename(from, to);
  return { viaGit: false };
}
