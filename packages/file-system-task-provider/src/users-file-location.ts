import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Nome do arquivo de registro de usuários.
 *
 * O nome repete o do diretório (`.taskin/.taskin-users.json`) por herança: o
 * arquivo nasceu na raiz do projeto e migrou para dentro de `.taskin/` sem ser
 * renomeado. Ver {@link resolveUsersFilePaths}.
 */
export const USERS_FILE_NAME = '.taskin-users.json';

/** Diretório de configuração local do Taskin. */
export const TASKIN_DIR_NAME = '.taskin';

/**
 * Nome dado ao arquivo legado quando o canônico já existe: nada é apagado, mas
 * o arquivo sai da raiz para não voltar a ser confundido com a fonte de verdade.
 */
export const PARKED_USERS_FILE_NAME = '.taskin-users.legacy.json';

/**
 * Os caminhos que o registro de usuários pode ocupar num projeto.
 *
 * @public
 */
export interface UsersFilePaths {
  /** `<root>/.taskin/.taskin-users.json` — o único caminho que o `UserRegistry` lê */
  canonical: string;
  /** `<root>/.taskin-users.json` — onde versões antigas do `initialize()` escreviam */
  legacy: string;
  /** `<root>/.taskin/.taskin-users.legacy.json` — destino de um legado redundante */
  parked: string;
}

/**
 * Resolve os caminhos do registro de usuários a partir da raiz do projeto.
 *
 * @public
 */
export function resolveUsersFilePaths(projectRoot: string): UsersFilePaths {
  const root = path.resolve(projectRoot);
  const taskinDir = path.join(root, TASKIN_DIR_NAME);

  return {
    canonical: path.join(taskinDir, USERS_FILE_NAME),
    legacy: path.join(root, USERS_FILE_NAME),
    parked: path.join(taskinDir, PARKED_USERS_FILE_NAME),
  };
}

/**
 * Onde o registro de usuários está, de fato.
 *
 * - `missing`: projeto sem registro (estado de um projeto novo)
 * - `canonical`: correto — dentro de `.taskin/`
 * - `legacy`: só na raiz — o `UserRegistry` não lê, todo assignee fica sem resolver
 * - `both`: os dois existem — o da raiz é resto e nunca foi lido
 *
 * @public
 */
export type UsersFileLocation = 'missing' | 'canonical' | 'legacy' | 'both';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Descobre em que caminho o registro de usuários do projeto está.
 *
 * @public
 */
export async function inspectUsersFileLocation(projectRoot: string): Promise<UsersFileLocation> {
  const paths = resolveUsersFilePaths(projectRoot);
  const [hasCanonical, hasLegacy] = await Promise.all([exists(paths.canonical), exists(paths.legacy)]);

  if (hasCanonical && hasLegacy) return 'both';
  if (hasCanonical) return 'canonical';
  if (hasLegacy) return 'legacy';
  return 'missing';
}

function isTrackedByGit(projectRoot: string, filePath: string): boolean {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', filePath], {
      cwd: projectRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function gitMove(projectRoot: string, from: string, to: string): boolean {
  try {
    execFileSync('git', ['mv', '--', from, to], { cwd: projectRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Move o arquivo preservando o histórico quando possível.
 *
 * `git mv` é preferido para arquivo versionado: o Git registra a renomeação (o
 * histórico do registro de usuários não recomeça do zero) e já deixa a mudança
 * staged. Projeto sem Git, ou arquivo não versionado/ignorado, cai no rename
 * do sistema de arquivos — a migração não pode depender de Git.
 */
async function moveFile(projectRoot: string, from: string, to: string): Promise<{ viaGit: boolean }> {
  await fs.mkdir(path.dirname(to), { recursive: true });

  if (isTrackedByGit(projectRoot, from) && gitMove(projectRoot, from, to)) {
    return { viaGit: true };
  }

  await fs.rename(from, to);
  return { viaGit: false };
}

/**
 * O que a correção fez.
 *
 * @public
 */
export type UsersFileFixAction = 'none' | 'moved' | 'parked';

/**
 * Resultado da correção do caminho do registro de usuários.
 *
 * @public
 */
export interface UsersFileFixResult {
  /** `moved`: legado promovido a canônico. `parked`: legado redundante tirado da raiz. */
  action: UsersFileFixAction;
  /** `true` quando o Git registrou a renomeação (histórico preservado, mudança staged) */
  viaGit: boolean;
  /** Caminho de origem, quando houve movimentação */
  from?: string;
  /** Caminho de destino, quando houve movimentação */
  to?: string;
}

/**
 * Aponta o registro de usuários fora de lugar.
 *
 * É o lado analisador: não escreve nada, só descreve o problema — o par de
 * {@link fixUsersFileLocation}, no mesmo desenho de `validateTaskFile` /
 * `fixTaskFile`.
 *
 * @param projectRoot - Raiz do projeto (o diretório que contém `.taskin/`)
 * @public
 */
export async function validateUsersFileLocation(projectRoot: string): Promise<ValidationIssue[]> {
  const paths = resolveUsersFilePaths(projectRoot);
  const location = await inspectUsersFileLocation(projectRoot);

  if (location === 'legacy') {
    return [
      {
        file: paths.legacy,
        message: `User registry is at the project root, where nothing reads it. The registry is read from ${path.join(TASKIN_DIR_NAME, USERS_FILE_NAME)}, so every task assignee is currently left unresolved.`,
        severity: 'error',
        suggestion: `Run lint with --fix to move it (via 'git mv' when the file is tracked).`,
      },
    ];
  }

  if (location === 'canonical' && (await exists(paths.parked))) {
    return [
      {
        file: paths.parked,
        message: `A parked legacy user registry is still sitting in ${TASKIN_DIR_NAME}/. It is read by nothing — it was moved out of the project root so it could be compared by hand.`,
        severity: 'info',
        suggestion: `Copy over any user missing from ${USERS_FILE_NAME} and delete it.`,
      },
    ];
  }

  if (location === 'both') {
    return [
      {
        file: paths.legacy,
        message: `Stale user registry at the project root, shadowed by ${path.join(TASKIN_DIR_NAME, USERS_FILE_NAME)} — it was never read, so any user added to it was silently ignored.`,
        severity: 'warning',
        suggestion: `Check whether it holds users missing from the canonical file, then run lint with --fix to move it out of the root as ${PARKED_USERS_FILE_NAME}.`,
      },
    ];
  }

  return [];
}

/**
 * Normaliza o caminho do registro de usuários.
 *
 * Regras, deliberadamente conservadoras — o conteúdo é dado do usuário, nada
 * é apagado nem mesclado automaticamente:
 *
 * - só o legado existe: promovido a canônico (o `UserRegistry` volta a ler)
 * - os dois existem: o canônico é a fonte de verdade e fica intocado; o legado
 *   sai da raiz como `.taskin-users.legacy.json` para o usuário comparar à mão.
 *   Mesclar seria arriscado: o legado costuma conter só o usuário sintético que
 *   o `initialize()` antigo semeava (`$USER` / `<user>@example.com`).
 * - qualquer outro estado: nada a fazer
 *
 * @param projectRoot - Raiz do projeto (o diretório que contém `.taskin/`)
 * @public
 */
export async function fixUsersFileLocation(projectRoot: string): Promise<UsersFileFixResult> {
  const paths = resolveUsersFilePaths(projectRoot);
  const location = await inspectUsersFileLocation(projectRoot);

  if (location === 'legacy') {
    const { viaGit } = await moveFile(projectRoot, paths.legacy, paths.canonical);
    return { action: 'moved', viaGit, from: paths.legacy, to: paths.canonical };
  }

  if (location === 'both') {
    const { viaGit } = await moveFile(projectRoot, paths.legacy, paths.parked);
    return { action: 'parked', viaGit, from: paths.legacy, to: paths.parked };
  }

  return { action: 'none', viaGit: false };
}
