import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { McpCommand, PackageManager } from './mcp-install.types.js';
import { mcpCommandFor } from './package-manager.js';

/** `pnpm taskin ...`, `yarn taskin ...`, `npm run taskin -- ...`. */
function viaScript(manager: PackageManager): McpCommand {
  if (manager === 'npm') {
    // O `--` e o que separa os argumentos do script dos do proprio npm.
    return { command: 'npm', args: ['run', 'taskin', '--', 'mcp-server'] };
  }
  return { command: manager, args: ['taskin', 'mcp-server'] };
}

function temScriptTaskin(raiz: string): boolean {
  try {
    const { scripts } = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf-8'));
    return typeof scripts?.taskin === 'string';
  } catch {
    return false;
  }
}

/**
 * Como alcancar o taskin **deste** projeto, e nao um taskin qualquer.
 *
 * Tres situacoes, nesta ordem:
 *
 * 1. **Binario em `node_modules/.bin`** — o caso normal de quem instalou o
 *    pacote. O executor do gerenciador o alcanca.
 * 2. **Script `taskin` no `package.json`** — o caso do proprio monorepo do
 *    taskin, onde ele nao e dependencia de si mesmo. Aqui o executor **nao**
 *    serve: sem binario local, `pnpm exec taskin` escorrega para um taskin
 *    instalado globalmente, de outra versao. Foi o que a sonda pegou na
 *    primeira execucao real — o servidor respondeu com as duas ferramentas de
 *    um 3.0.3 global em vez das tres desta versao.
 * 3. **Nenhum dos dois** — ainda assim o executor, que e o que vai funcionar
 *    depois que a pessoa instalar.
 *
 * @param raiz - A raiz do projeto, de `findProjectRoot`
 * @public
 */
export function resolveInvocation(raiz: string, manager: PackageManager): McpCommand {
  if (existsSync(path.join(raiz, 'node_modules', '.bin', 'taskin'))) {
    return mcpCommandFor(manager);
  }

  if (temScriptTaskin(raiz)) {
    return viaScript(manager);
  }

  return mcpCommandFor(manager);
}
