import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

vi.mock('../lib/colors.js', () => ({
  printHeader: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn().mockResolvedValue({
    provider: {},
    userRegistry: { load: vi.fn().mockResolvedValue(undefined) },
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  }),
}));

vi.mock('@opentask/taskin-task-manager', () => ({
  TaskManager: vi.fn(),
}));

const wsStart = vi.fn();

vi.mock('@opentask/taskin-task-server-ws', () => ({
  TaskWebSocketServer: class {
    start = wsStart;
    stop = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      access: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('<html><head></head><body></body></html>'),
    },
  };
});

const httpBusy = { value: false };

vi.mock('http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('http')>();
  return {
    ...actual,
    createServer: vi.fn(() => ({
      listen: vi.fn((_port: number, _host: string, cb?: () => void) => {
        if (httpBusy.value) {
          throw Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' });
        }
        if (cb) cb();
      }),
      close: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
    })),
  };
});

async function runDashboard(args: string[] = []) {
  const { Command } = await import('commander');
  const { dashboardCommand } = await import('./dashboard.js');
  const program = new Command();
  dashboardCommand(program);
  await program.parseAsync(['node', 'taskin', 'dashboard', ...args]);
}

function allMessages(fn: unknown): string {
  return (fn as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0])).join('\n');
}

describe('dashboard command - busy port hint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpBusy.value = false;
  });

  it('points at --ws-port when the WebSocket port is already in use', async () => {
    wsStart.mockRejectedValueOnce(
      Object.assign(new Error('listen EADDRINUSE: address already in use 127.0.0.1:3001'), { code: 'EADDRINUSE' }),
    );
    const colors = await import('../lib/colors.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDashboard();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(allMessages(colors.error)).toContain('WebSocket port 3001 is already in use');
    expect(allMessages(colors.info)).toContain('--ws-port <port>');
    expect(allMessages(colors.info)).toContain('taskin dashboard --ws-port 3002');

    exitSpy.mockRestore();
  });

  it('suggests the port after the one requested with --ws-port', async () => {
    wsStart.mockRejectedValueOnce(Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' }));
    const colors = await import('../lib/colors.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDashboard(['--ws-port', '4000']);

    expect(allMessages(colors.error)).toContain('WebSocket port 4000 is already in use');
    expect(allMessages(colors.info)).toContain('taskin dashboard --ws-port 4001');

    exitSpy.mockRestore();
  });

  it('does not show the --ws-port hint for unrelated WebSocket failures', async () => {
    wsStart.mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: 'EACCES' }));
    const colors = await import('../lib/colors.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDashboard();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(allMessages(colors.info)).not.toContain('--ws-port');

    exitSpy.mockRestore();
  });

  it('points at --port when no dashboard port is free', async () => {
    wsStart.mockResolvedValueOnce(undefined);
    httpBusy.value = true;
    const colors = await import('../lib/colors.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDashboard();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(allMessages(colors.info)).toContain('--port <port>');

    exitSpy.mockRestore();
  });
});
