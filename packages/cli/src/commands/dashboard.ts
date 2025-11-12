/**
 * Dashboard command - Start WebSocket server and Vite dev server
 */

import { FileSystemTaskProvider } from '@opentask/taskin-fs-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import { TaskWebSocketServer } from '@opentask/taskin-task-server-ws';
import chalk from 'chalk';
import { spawn } from 'child_process';
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
    const tasksDir = path.join(process.cwd(), 'TASKS');
    const provider = new FileSystemTaskProvider(tasksDir);
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

    const dashboardPath = path.join(
      process.cwd(),
      'node_modules',
      '@opentask',
      'taskin-dashboard',
    );

    const viteArgs = [
      'vite',
      '--port',
      port.toString(),
      '--host',
      host,
      '--strictPort',
    ];

    if (options.open) {
      viteArgs.push('--open');
    }

    const viteProcess = spawn('npx', viteArgs, {
      cwd: dashboardPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_WS_URL: `ws://${host}:${wsPort}`,
      },
    });

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
