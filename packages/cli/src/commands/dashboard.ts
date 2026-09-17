/**
 * Dashboard command - Start WebSocket server and HTTP server for dashboard
 */

import { TaskManager } from '@opentask/taskin-task-manager';
import { TaskWebSocketServer } from '@opentask/taskin-task-server-ws';
import { escapeHtml, isValidHost, isValidPort } from '@opentask/taskin-utils';
import chalk from 'chalk';
import express from 'express';
import { createServer, type Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAvatarHandler } from '../lib/avatar-proxy.js';
import { error, info, printHeader, success, warning } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DashboardOptions {
  port?: number;
  wsPort?: number;
  browser?: boolean;
  host?: string;
  open?: boolean;
  closed?: boolean;
  active?: boolean;
}

export interface DashboardAppOptions {
  /** Directory holding the built dashboard (index.html + static assets). */
  dashboardDist: string;
  /** Host advertised to the browser inside the injected `VITE_WS_URL`. */
  host: string;
  /** WebSocket port advertised to the browser inside the injected `VITE_WS_URL`. */
  wsPort: number;
  /** Como perguntar os grupos do projeto. Ausente quando o provider nao tem o conceito. */
  readonly groups?: () => Promise<{ id: string; name: string }[]>;
  /** Numeracao inicial de prioridade. Ausente quando nao ha manager disponivel. */
  readonly prioritize?: (options: {
    dryRun?: boolean;
  }) => Promise<{ total: number; withoutPriority: number; changed: number }>;
}

/**
 * Assemble the dashboard's Express app: security headers, `VITE_WS_URL`
 * injection into `index.html`, the avatar proxy, static serving and the 404
 * catch-all.
 *
 * Pure on purpose — no `listen`, no WebSocket, no browser, no signal handlers.
 * The command wires those around it; tests mount it on port 0 and hit the
 * routes. See task-058: mocking the layer under change (express, the static
 * server) is ceremony, not a test.
 */
export function createDashboardApp({
  dashboardDist,
  host,
  wsPort,
  groups,
  prioritize,
}: DashboardAppOptions): express.Express {
  const app = express();

  // Security: Disable X-Powered-By header
  app.disable('x-powered-by');

  // Security: Set security headers
  app.use((_req, res, next) => {
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
        .then((fs) => fs.promises.readFile(path.join(dashboardDist, 'index.html'), 'utf-8'))
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

  // Avatar proxy: the browser asks this server for /avatar/<hash> instead of
  // talking to a third party. Keeps IP/referrer in-house, works offline, and
  // stays inside the `img-src 'self'` CSP above. See task-067.
  const avatarHandler = createAvatarHandler();
  app.get('/avatar/:hash', (req, res) => {
    void avatarHandler(req, res);
  });

  /*
   * Os grupos, para o dashboard resolver o nome pelo id.
   *
   * O nome nao viaja mais dentro de cada tarefa (task-079): a tarefa carrega
   * `groupId`, e quem desenha a tela pergunta os nomes aqui. Um provider sem o
   * conceito devolve lista vazia, e a tela simplesmente nao mostra nome.
   */
  app.get('/api/groups', (_req, res) => {
    void (async () => {
      try {
        res.json({ groups: (await groups?.()) ?? [] });
      } catch {
        res.json({ groups: [] });
      }
    })();
  });

  /*
   * Priorizacao inicial, pela tela.
   *
   * Num projeto meio numerado o primeiro arrastar reescreve dezenas de arquivos
   * — 124 num projeto de 500, medido. O `GET` diz o tamanho do problema para a
   * tela poder avisar antes; o `POST` executa, uma vez, de proposito.
   */
  app.get('/api/prioritize', (_req, res) => {
    void (async () => {
      try {
        res.json(await prioritize?.({ dryRun: true }));
      } catch {
        res.json(undefined);
      }
    })();
  });

  app.post('/api/prioritize', (_req, res) => {
    void (async () => {
      try {
        res.json(await prioritize?.({}));
      } catch (erro) {
        res.status(500).json({ error: erro instanceof Error ? erro.message : 'failed' });
      }
    })();
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
  app.use((_req, res) => {
    res.status(404).send('Not Found');
  });

  return app;
}

async function startHttpServer(
  app: express.Express,
  startPort: number,
  host: string,
  maxAttempts = 10,
): Promise<{ server: Server; port: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tryPort = startPort + attempt;
    try {
      const server = createServer(app);
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(tryPort, host, () => resolve());
      });
      return { server, port: tryPort };
    } catch (err) {
      const nodeErr = err as { code?: string };
      if (nodeErr.code !== 'EADDRINUSE') {
        throw err;
      }
      if (attempt < maxAttempts - 1) {
        info(`Port ${tryPort} is in use, trying port ${tryPort + 1}...`);
      }
    }
  }
  throw new Error(
    `Could not find an available port after ${maxAttempts} attempts (tried ${startPort}-${startPort + maxAttempts - 1})`,
  );
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
      flags: '-b, --browser',
      description: 'Open browser automatically',
    },
    {
      flags: '--open',
      description: 'Show only open tasks (pending, in-progress, blocked)',
    },
    {
      flags: '--closed',
      description: 'Show only closed tasks (done, canceled)',
    },
    {
      flags: '--active',
      description: 'Show only tasks started and not finished (in-progress, paused, in-review)',
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
    error(`Invalid host: ${host}. Must be localhost, a valid IPv4 address, or hostname.`);
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
    error(`Invalid WebSocket port: ${options.wsPort}. Must be between 1 and 65535.`);
    process.exit(1);
  }

  // Parse port values (Commander may pass them as strings)
  const port = typeof options.port === 'string' ? parseInt(options.port, 10) : options.port || 5173;
  const wsPort = typeof options.wsPort === 'string' ? parseInt(options.wsPort, 10) : options.wsPort || 3001;

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

    // A descoberta acima achou a raiz do projeto; o provider vem de la
    const monorepoRoot = path.dirname(tasksDir);
    const { provider } = await resolveTaskProvider({ cwd: monorepoRoot });
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
    success(`WebSocket server running on ws://${host}:${wsPort}`);

    // Start HTTP server for dashboard
    info(`Starting dashboard server on http://${host}:${port}...`);

    // Find dashboard dist directory
    // In dev (tsx): __dirname = src/commands -> need ../../dashboard-dist
    // In prod (built): __dirname = dist -> need ../dashboard-dist
    const isDev = __dirname.includes('/src/');
    const dashboardDist = isDev
      ? path.join(__dirname, '..', '..', 'dashboard-dist')
      : path.join(__dirname, '..', 'dashboard-dist');

    const registroDeGrupos = (
      provider as { groupRegistry?: { listGroups: () => Promise<{ id: string; name: string }[]> } }
    ).groupRegistry;

    const app = createDashboardApp({
      dashboardDist,
      host,
      wsPort,
      groups: registroDeGrupos ? () => registroDeGrupos.listGroups() : undefined,
      prioritize: (opcoes) => new TaskManager(provider).prioritizeAll(opcoes),
    });

    const { server: httpServer, port: actualPort } = await startHttpServer(app, port, host);

    if (actualPort !== port) {
      warning(`Port ${port} was in use. Dashboard started on port ${actualPort}.`);
    }

    success(`Dashboard available at http://${host}:${actualPort}`);

    // Build filter query params
    const filterParams = new URLSearchParams();
    if (options.open) {
      filterParams.set('filter', 'open');
    } else if (options.closed) {
      filterParams.set('filter', 'closed');
    } else if (options.active) {
      filterParams.set('filter', 'active');
    }
    const filterQuery = filterParams.toString() ? `?${filterParams.toString()}` : '';

    // Open browser if requested
    if (options.browser) {
      const url = `http://${host}:${actualPort}${filterQuery}`;
      await import('child_process').then((cp) => {
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        cp.exec(`${cmd} ${url}`);
      });
    }

    info('');
    info(chalk.bold('Dashboard Controls:'));
    info(`  • Dashboard: ${chalk.cyan(`http://${host}:${actualPort}${filterQuery}`)}`);
    info(`  • WebSocket: ${chalk.cyan(`ws://${host}:${wsPort}`)}`);
    if (options.open) {
      info(`  • Filter: ${chalk.yellow('Open tasks only')}`);
    } else if (options.closed) {
      info(`  • Filter: ${chalk.yellow('Closed tasks only')}`);
    } else if (options.active) {
      info(`  • Filter: ${chalk.yellow('Active tasks only')}`);
    }
    info(`  • Press ${chalk.bold('Ctrl+C')} to stop both servers`);
    info('');

    // Handle process termination
    const cleanup = async () => {
      info('\nShutting down servers...');
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
      await wsServer.stop();
      success('Servers stopped');
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
