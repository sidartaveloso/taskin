/**
 * Dashboard command - Start WebSocket server and Vite dev server
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-fs-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import { TaskWebSocketServer } from '@opentask/taskin-task-server-ws';
import chalk from 'chalk';
import { exec } from 'child_process';
import path from 'path';
import { error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface DashboardOptions {
  port?: number;
  wsPort?: number;
  open?: boolean;
  host?: string;
}

export const dashboardCommand = defineCommand({
  name: 'dashboard',
  description: '📊 Start the Taskin dashboard with WebSocket server',
  alias: 'dash',
  options: [
    {
      flags: '-p, --port <port>',
      description: 'Vite dev server port',
      defaultValue: '5173',
    },
    {
      flags: '-w, --ws-port <port>',
      description: 'WebSocket server port',
      defaultValue: '3001',
    },
    {
      flags: '-h, --host <host>',
      description: 'Host to bind servers',
      defaultValue: 'localhost',
    },
    {
      flags: '-o, --open',
      description: 'Open browser automatically',
    },
  ],
  handler: async (options: DashboardOptions) => {
    await startDashboard(options);
  },
});

async function startDashboard(options: DashboardOptions): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  const port = options.port || 5173;
  const wsPort = options.wsPort || 3001;
  const host = options.host || 'localhost';

  printHeader('Starting Taskin Dashboard', '📊');

  try {
    // Initialize task provider and manager
    info('Initializing task provider...');

    // Find monorepo root by looking for pnpm-workspace.yaml
    let currentDir = process.cwd();
    let tasksDir = path.join(currentDir, 'TASKS');

    // If TASKS doesn't exist in current dir, try to find monorepo root
    try {
      await import('fs').then((fs) => fs.promises.access(tasksDir));
    } catch {
      // Look for pnpm-workspace.yaml to find monorepo root
      while (currentDir !== path.dirname(currentDir)) {
        const workspaceFile = path.join(currentDir, 'pnpm-workspace.yaml');
        try {
          await import('fs').then((fs) => fs.promises.access(workspaceFile));
          tasksDir = path.join(currentDir, 'TASKS');
          break;
        } catch {
          currentDir = path.dirname(currentDir);
        }
      }
    }

    info(`Using tasks directory: ${tasksDir}`);

    // Initialize UserRegistry and load users
    const monorepoRoot = path.dirname(tasksDir);
    const taskinDir = path.join(monorepoRoot, '.taskin');
    const userRegistry = new UserRegistry({ taskinDir });
    await userRegistry.load();

    // Create provider with injected UserRegistry
    const provider = new FileSystemTaskProvider(tasksDir, userRegistry);
    const manager = new TaskManager(provider);

    // Start WebSocket server
    info(`Starting WebSocket server on ${host}:${wsPort}...`);
    const wsServer = new TaskWebSocketServer({
      taskManager: manager,
      taskProvider: provider,
      options: {
        port: wsPort,
        host,
      },
    });

    await wsServer.start();
    success(`✓ WebSocket server running on ws://${host}:${wsPort}`);

    // Start Vite dev server
    info(`Starting Vite dev server on http://${host}:${port}...`);

    // Use the monorepoRoot already calculated above
    const dashboardPath = path.join(monorepoRoot, 'packages', 'dashboard');

    // Build vite command
    let viteCommand = `cd "${dashboardPath}" && pnpm exec vite`;
    viteCommand += ` --port ${port}`;
    viteCommand += ` --host ${host}`;
    viteCommand += ' --strictPort';
    if (options.open) {
      viteCommand += ' --open';
    }

    const viteProcess = exec(viteCommand, {
      env: {
        ...process.env,
        VITE_WS_URL: `ws://${host}:${wsPort}`,
      },
    });

    // Pipe vite output
    if (viteProcess.stdout) {
      viteProcess.stdout.pipe(process.stdout);
    }
    if (viteProcess.stderr) {
      viteProcess.stderr.pipe(process.stderr);
    }

    success(`✓ Dashboard available at http://${host}:${port}`);
    info('');
    info(chalk.bold('Dashboard Controls:'));
    info(`  • Dashboard: ${chalk.cyan(`http://${host}:${port}`)}`);
    info(`  • WebSocket: ${chalk.cyan(`ws://${host}:${wsPort}`)}`);
    info(`  • Press ${chalk.bold('Ctrl+C')} to stop both servers`);
    info('');

    // Handle process termination
    const cleanup = async () => {
      info('\nShutting down servers...');
      viteProcess.kill();
      await wsServer.stop();
      success('✓ Servers stopped');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Wait for Vite process to exit
    viteProcess.on('exit', async (code) => {
      if (code !== 0) {
        error(`Vite dev server exited with code ${code}`);
      }
      await wsServer.stop();
      process.exit(code || 0);
    });
  } catch (err) {
    error('Failed to start dashboard');
    if (err instanceof Error) {
      error(err.message);
    }
    process.exit(1);
  }
}
