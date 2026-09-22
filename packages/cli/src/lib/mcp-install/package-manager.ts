import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { McpCommand, PackageManager } from './mcp-install.types.js';

/**
 * Lockfile → gerenciador, na ordem em que vale a pena perguntar.
 *
 * `package-lock.json` fica depois dos outros dois porque ele aparece junto com
 * eles em projeto que trocou de gerenciador e nao limpou o antigo.
 */
const POR_LOCKFILE: ReadonlyArray<readonly [string, PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
];

/**
 * O campo `packageManager` do `package.json`, quando declarado.
 *
 * Vale mais que o lockfile: e declaracao explicita de quem mantem o projeto, e
 * o corepack a respeita. Um `package.json` malformado nao e erro aqui — so
 * significa que nao ha declaracao, e a busca segue pelo lockfile.
 */
function declarado(raiz: string): PackageManager | undefined {
  try {
    const { packageManager } = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf-8'));
    if (typeof packageManager !== 'string') return undefined;

    const nome = packageManager.split('@')[0];
    return POR_LOCKFILE.some(([, gerenciador]) => gerenciador === nome) ? (nome as PackageManager) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Qual gerenciador o projeto usa.
 *
 * Recebe o **diretorio**, e nao o assume: a versao anterior fazia
 * `existsSync('pnpm-lock.yaml')` relativo ao cwd, entao rodar de um
 * subdiretorio devolvia `npm` em silencio.
 *
 * @param raiz - A raiz do projeto, de `findProjectRoot`
 * @public
 */
export function detectPackageManager(raiz: string): PackageManager {
  const explicito = declarado(raiz);
  if (explicito) return explicito;

  for (const [lockfile, gerenciador] of POR_LOCKFILE) {
    if (existsSync(path.join(raiz, lockfile))) return gerenciador;
  }

  return 'npm';
}

/**
 * Como invocar o servidor MCP do taskin por cada gerenciador.
 *
 * Nenhum deles e `pnpm taskin mcp-server`: aquilo so funciona dentro do
 * monorepo do taskin, onde ha um script `taskin` na raiz. Num projeto que
 * instalou do npm, o binario esta em `node_modules/.bin` e quem o alcanca e o
 * executor de cada gerenciador.
 *
 * @public
 */
export function mcpCommandFor(manager: PackageManager): McpCommand {
  switch (manager) {
    case 'pnpm':
      return { command: 'pnpm', args: ['exec', 'taskin', 'mcp-server'] };
    case 'yarn':
      return { command: 'yarn', args: ['taskin', 'mcp-server'] };
    case 'bun':
      return { command: 'bunx', args: ['taskin', 'mcp-server'] };
    case 'npm':
      return { command: 'npx', args: ['taskin', 'mcp-server'] };
  }
}
