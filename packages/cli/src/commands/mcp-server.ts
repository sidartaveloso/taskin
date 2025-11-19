/**
 * MCP Server command - Start Model Context Protocol server
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-fs-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import type { MCPTransportType } from '@opentask/taskin-task-server-mcp';
import { TaskMCPServer } from '@opentask/taskin-task-server-mcp';
import chalk from 'chalk';
import path from 'path';
import { error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface MCPServerOptions {
  transport?: MCPTransportType;
  debug?: boolean;
}

export const mcpServerCommand = defineCommand({
  name: 'mcp-server',
  description: '🤖 Start Model Context Protocol server for LLM integration',
  alias: 'mcp',
  options: [
    {
      flags: '-t, --transport <type>',
      description: 'Transport type (stdio or sse)',
      defaultValue: 'stdio',
    },
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
  // Check if project is initialized
  requireTaskinProject();

  const transport = (options.transport || 'stdio') as MCPTransportType;
  const debug = options.debug || false;

  printHeader('Starting MCP Server', '🤖');

  try {
    // Initialize task provider and manager
    info('Initializing task manager...');
    const tasksDir = path.join(process.cwd(), 'TASKS');

    // Initialize UserRegistry
    const monorepoRoot = path.dirname(tasksDir);
    const taskinDir = path.join(monorepoRoot, '.taskin');
    const userRegistry = new UserRegistry({ taskinDir });
    await userRegistry.load();

    const provider = new FileSystemTaskProvider(tasksDir, userRegistry);
    const manager = new TaskManager(provider);

    // Create MCP server
    info(`Creating MCP server with ${transport} transport...`);
    const mcpServer = new TaskMCPServer({
      taskManager: manager,
      name: 'taskin-mcp-server',
      version: '1.0.0',
      debug,
    });

    // Connect and start
    info('Starting MCP server...');
    await mcpServer.connect({ transport });

    success('✓ MCP server started successfully');
    info('');
    info(chalk.bold('Server Information:'));
    info(`  • Transport: ${chalk.cyan(transport)}`);
    info(`  • Debug: ${chalk.cyan(debug ? 'enabled' : 'disabled')}`);
    info('');
    info(chalk.bold('Available Tools:'));
    info(`  • ${chalk.green('start_task')} - Start working on a task`);
    info(`  • ${chalk.green('finish_task')} - Mark a task as finished`);
    info('');
    info(chalk.bold('Available Prompts:'));
    info(
      `  • ${chalk.green('start-task-workflow')} - Guide for starting tasks`,
    );
    info(
      `  • ${chalk.green('finish-task-workflow')} - Guide for finishing tasks`,
    );
    info(`  • ${chalk.green('task-summary')} - Get task summary and insights`);
    info('');
    info(chalk.bold('Available Resources:'));
    info(`  • ${chalk.green('taskin://tasks')} - Access all tasks`);
    info('');
    info(`Press ${chalk.bold('Ctrl+C')} to stop the server`);
    info('');

    // Handle process termination
    const cleanup = async () => {
      info('\nShutting down MCP server...');
      // MCP server will close automatically when process exits
      success('✓ Server stopped');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep process alive
    await new Promise(() => {
      // Wait indefinitely
    });
  } catch (err) {
    error('Failed to start MCP server');
    if (err instanceof Error) {
      error(err.message);
      if (debug) {
        console.error(err.stack);
      }
    }
    process.exit(1);
  }
}
