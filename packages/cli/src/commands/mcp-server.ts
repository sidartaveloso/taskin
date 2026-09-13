/**
 * MCP Server command - Start Model Context Protocol server
 */

import { TaskManager } from '@opentask/taskin-task-manager';
import { TaskMCPServer } from '@opentask/taskin-task-server-mcp';
import chalk from 'chalk';
import path from 'path';
import { colors } from '../lib/colors.js';
import { createMcpStatusCommitHook } from '../lib/mcp-status-hook/index.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

interface MCPServerOptions {
  debug?: boolean;
}

/*
 * Este comando **nao** usa os `info`/`success` de `lib/colors`, e e o unico
 * assim.
 *
 * No transporte stdio o stdout e o canal do protocolo: tudo que sai por ali e
 * mensagem JSON-RPC, e nada mais. Os helpers escrevem com `console.log`, que
 * cairia no meio das mensagens. Funcionava por tolerancia dos clientes, que
 * descartam a linha que nao parseia — inclusive a sonda do `mcp-install`, que
 * faz isso de proposito. Tolerancia nao e correcao.
 *
 * O que a pessoa le vai pelo stderr, que nao carrega protocolo nenhum.
 */
const linha = (texto = '') => process.stderr.write(`${texto}\n`);
const aviso = (mensagem: string) => linha(colors.info(`\u2139 ${mensagem}`));
const feito = (mensagem: string) => linha(colors.success(`\u2713 ${mensagem}`));
const falha = (mensagem: string) => linha(colors.error(`\u2717 ${mensagem}`));

function cabecalho(titulo: string, icone: string): void {
  linha();
  linha(colors.highlight('='.repeat(60)));
  linha(colors.highlight(`${icone}  ${titulo}`));
  linha(colors.highlight('='.repeat(60)));
  linha();
}

export const mcpServerCommand = defineCommand({
  name: 'mcp-server',
  description: '🤖 Start Model Context Protocol server for LLM integration',
  alias: 'mcp',
  options: [
    {
      flags: '-d, --debug',
      description: 'Enable debug logging',
    },
  ],
  handler: async (options: MCPServerOptions) => {
    await startMCPServer(options);
  },
});

async function startMCPServer(options: MCPServerOptions): Promise<void> {
  requireTaskinProject();

  const debug = options.debug || false;

  cabecalho('Starting MCP Server', '\u{1F916}');

  try {
    aviso('Initializing task manager...');
    const { provider, projectRoot: monorepoRoot } = await resolveTaskProvider();
    const manager = new TaskManager(provider);

    // Same status-change commit `taskin start`/`finish` make, so the two doors
    // to the operation leave the same history when `automation.level` asks for
    // it (task-066). Undefined when the project does not auto-commit — then the
    // MCP path is a pure status change, exactly like the CLI in that project.
    const onStatusChange = createMcpStatusCommitHook({ monorepoRoot });

    const mcpServer = new TaskMCPServer({
      taskManager: manager,
      name: 'taskin-mcp-server',
      version: '1.0.0',
      debug,
      onStatusChange,
    });

    aviso('Starting MCP server over stdio...');
    await mcpServer.connect({ transport: 'stdio' });

    feito('MCP server started successfully');
    linha();
    aviso(`  ${chalk.bold('Debug')}: ${chalk.cyan(debug ? 'enabled' : 'disabled')}`);
    linha();

    /*
     * Perguntado ao servidor, e nao escrito aqui. A lista a mao ja tinha ficado
     * para tras uma vez: anunciava `start_task` e `finish_task` e esquecia
     * `list_tasks`, o mesmo defeito que a documentacao tinha.
     */
    aviso(chalk.bold('Available Tools:'));
    for (const ferramenta of mcpServer.listTools().tools) {
      aviso(`  \u2022 ${chalk.green(ferramenta.name)} - ${ferramenta.description}`);
    }
    linha();

    aviso(chalk.bold('Available Prompts:'));
    for (const prompt of mcpServer.listPrompts().prompts) {
      aviso(`  \u2022 ${chalk.green(prompt.name)} - ${prompt.description}`);
    }
    linha();

    aviso(`Press ${chalk.bold('Ctrl+C')} to stop the server`);
    linha();

    const cleanup = () => {
      linha();
      aviso('Shutting down MCP server...');
      feito('Server stopped');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    await new Promise(() => {
      // O servidor vive enquanto o cliente mantiver o processo aberto.
    });
  } catch (err) {
    falha('Failed to start MCP server');
    if (err instanceof Error) {
      falha(err.message);
      if (debug) {
        console.error(err.stack);
      }
    }
    process.exit(1);
  }
}
