/**
 * `taskin mcp-install` — registra o servidor MCP no `.mcp.json` do projeto.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { error, info, success, warning } from '../lib/colors.js';
import {
  detectPackageManager,
  mergeMcpConfig,
  NOME_DO_SERVIDOR,
  probeMcpServer,
  resolveInvocation,
} from '../lib/mcp-install/index.js';
import { findProjectRoot } from '../lib/project-root/index.js';
import { defineCommand } from './define-command/index.js';

interface McpInstallOptions {
  force?: boolean;
  probe?: boolean;
}

const ARQUIVO = '.mcp.json';

/** `undefined` quando nao existe — o que o merge trata como "criar". */
function lerSeExistir(caminho: string): string | undefined {
  try {
    return readFileSync(caminho, 'utf-8');
  } catch {
    return undefined;
  }
}

export const mcpInstallCommand = defineCommand({
  name: 'mcp-install',
  description: "🔌 Register the Taskin MCP server in this project's .mcp.json",
  options: [
    {
      flags: '-f, --force',
      description: 'Replace an existing taskin entry that differs',
    },
    {
      flags: '--no-probe',
      description: 'Skip starting the server to verify the entry works',
    },
  ],
  handler: async (options: McpInstallOptions) => {
    await instalar(options);
  },
});

async function instalar(options: McpInstallOptions): Promise<void> {
  /*
   * A raiz, e nao o cwd: rodando de `packages/algo`, o `.mcp.json` tem que ir
   * para a raiz do projeto, e o gerenciador tem que ser detectado la.
   */
  const raiz = findProjectRoot();

  if (!raiz) {
    error('No .taskin.json found here or in any parent directory. Run "taskin init" first.');
    process.exit(1);
  }

  const caminho = path.join(raiz, ARQUIVO);
  const manager = detectPackageManager(raiz);
  const entrada = resolveInvocation(raiz, manager);

  info(`Project root: ${raiz}`);
  info(`Package manager: ${manager} — the entry will run \`${[entrada.command, ...entrada.args].join(' ')}\``);

  const resultado = mergeMcpConfig(lerSeExistir(caminho), entrada, { overwrite: options.force === true });

  switch (resultado.outcome) {
    case 'unreadable':
      error(`${ARQUIVO} exists but ${resultado.reason}. Nothing was written — fix or remove it first.`);
      process.exit(1);
      return;

    case 'conflict':
      warning(`${ARQUIVO} already has a "${NOME_DO_SERVIDOR}" entry that differs:`);
      console.log(`  current: ${JSON.stringify(resultado.current)}`);
      console.log(`  new:     ${JSON.stringify(entrada)}`);
      info('Run again with --force to replace it.');
      process.exit(1);
      return;

    case 'unchanged':
      success(`${ARQUIVO} already registers the Taskin MCP server. Nothing to do.`);
      break;

    default:
      writeFileSync(caminho, `${JSON.stringify(resultado.config, null, 2)}\n`, 'utf-8');
      success(
        resultado.outcome === 'created'
          ? `Created ${ARQUIVO}`
          : `${resultado.outcome === 'added' ? 'Added' : 'Replaced'} the "${NOME_DO_SERVIDOR}" entry in ${ARQUIVO}`,
      );
  }

  if (options.probe === false) {
    info('Skipped the check. Run without --no-probe to verify the server actually starts.');
    return;
  }

  /*
   * Validar a forma nao basta: um comando bem escrito ainda pode nao resolver,
   * e o servidor pode subir e falhar no protocolo. Foi exatamente assim que
   * `start_task` e `finish_task` ficaram quebrados pelo transporte real sem
   * nenhum teste perceber.
   */
  info('Starting the server to check the entry actually works...');
  /*
   * As ferramentas que **esta** versao do taskin oferece, perguntadas ao proprio
   * servidor que o CLI carrega. Derivadas, e nao escritas a mao: uma ferramenta
   * nova passa a ser exigida da instalacao sem ninguem lembrar de atualizar
   * uma lista.
   */
  const { TaskMCPServer } = await import('@opentask/taskin-task-server-mcp');
  const esperadas = new TaskMCPServer({ taskManager: {} as never }).listTools().tools.map((t) => t.name);

  const sonda = await probeMcpServer(entrada, raiz, esperadas);

  if (!sonda.ok) {
    error(`The entry was written, but the server did not answer: ${sonda.reason}`);
    if (sonda.stderr) {
      console.log(sonda.stderr);
    }
    process.exit(1);
    return;
  }

  success(`The server answered with ${sonda.tools.length} tool(s): ${sonda.tools.join(', ')}`);
}
