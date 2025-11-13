/**
 * Dashboard command - Start WebSocket server and HTTP server for dashboard
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-fs-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import { TaskWebSocketServer } from '@opentask/taskin-task-server-ws';
import { escapeHtml, isValidHost, isValidPort } from '@opentask/taskin-utils';
import chalk from 'chalk';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const host = options.host || 'localhost';

  // Security: Validate host before any parsing
  if (!isValidHost(host)) {
    error('Security validation failed');
    error(
      `Invalid host: ${host}. Must be localhost, a valid IPv4 address, or hostname.`,
    );
    process.exit(1);
  }

  // Security: Validate port strings before parsing
  if (typeof options.port === 'string' && !isValidPort(options.port)) {
    error('Security validation failed');
    error(`Invalid port: ${options.port}. Must be between 1 and 65535.`);
    process.exit(1);
  }
  if (typeof options.wsPort === 'string' && !isValidPort(options.wsPort)) {
    error('Security validation failed');
    error(
      `Invalid WebSocket port: ${options.wsPort}. Must be between 1 and 65535.`,
    );
    process.exit(1);
  }

  // Parse port values (Commander may pass them as strings)
  const port =
    typeof options.port === 'string'
      ? parseInt(options.port, 10)
      : options.port || 5173;
  const wsPort =
    typeof options.wsPort === 'string'
      ? parseInt(options.wsPort, 10)
      : options.wsPort || 3001;

  if (!isValidPort(port)) {
    error('Security validation failed');
    error(`Invalid port: ${port}. Must be between 1 and 65535.`);
    process.exit(1);
  }

  if (!isValidPort(wsPort)) {
    error('Security validation failed');
    error(`Invalid WebSocket port: ${wsPort}. Must be between 1 and 65535.`);
    process.exit(1);
  }

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

    // Start HTTP server for dashboard
    info(`Starting dashboard server on http://${host}:${port}...`);

    // Find dashboard dist directory (relative to CLI dist folder)
    const dashboardDist = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'dashboard-dist',
    );

    const app = express();

    // Security: Disable X-Powered-By header
    app.disable('x-powered-by');

    // Security: Set security headers
    app.use((req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      // Prevent MIME sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      // Content Security Policy - only allow same origin
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;",
      );
      next();
    });

    // Inject WebSocket URL into HTML
    app.use((req, res, next) => {
      if (req.path === '/' || req.path === '/index.html') {
        import('fs')
          .then((fs) =>
            fs.promises.readFile(
              path.join(dashboardDist, 'index.html'),
              'utf-8',
            ),
          )
          .then((html) => {
            // Security: Escape values before injecting into HTML to prevent XSS
            const safeHost = escapeHtml(host);
            const safeWsPort = escapeHtml(String(wsPort));

            // Inject WebSocket URL as environment variable
            const injectedHtml = html.replace(
              '</head>',
              `<script>window.VITE_WS_URL = 'ws://${safeHost}:${safeWsPort}';</script></head>`,
            );
            res.send(injectedHtml);
          })
          .catch((err) => {
            console.error('Failed to read index.html:', err);
            res.status(500).send('Internal Server Error');
          });
      } else {
        next();
      }
    });

    // Security: Serve static files with options to prevent path traversal
    app.use(
      express.static(dashboardDist, {
        dotfiles: 'deny', // Deny access to dotfiles
        index: false, // Don't serve index.html here (handled above)
        redirect: false, // Don't redirect to trailing slash
      }),
    );

    // Security: Catch-all for undefined routes (prevent information disclosure)
    app.use((req, res) => {
      res.status(404).send('Not Found');
    });

    const httpServer = createServer(app);
    await new Promise<void>((resolve) => {
      httpServer.listen(port, host, () => {
        resolve();
      });
    });

    success(`✓ Dashboard available at http://${host}:${port}`);

    // Open browser if requested
    if (options.open) {
      const url = `http://${host}:${port}`;
      await import('child_process').then((cp) => {
        const cmd =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'start'
              : 'xdg-open';
        cp.exec(`${cmd} ${url}`);
      });
    }

    info('');
    info(chalk.bold('Dashboard Controls:'));
    info(`  • Dashboard: ${chalk.cyan(`http://${host}:${port}`)}`);
    info(`  • WebSocket: ${chalk.cyan(`ws://${host}:${wsPort}`)}`);
    info(`  • Press ${chalk.bold('Ctrl+C')} to stop both servers`);
    info('');

    // Handle process termination
    const cleanup = async () => {
      info('\nShutting down servers...');
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
      await wsServer.stop();
      success('✓ Servers stopped');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    error('Failed to start dashboard');
    if (err instanceof Error) {
      error(err.message);
    }
    process.exit(1);
  }
}
