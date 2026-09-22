import { describe, expect, it, vi } from 'vitest';

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

// O comando escolhe o provider pela factory; este teste e sobre selecao de porta
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

vi.mock('@opentask/taskin-task-server-ws', () => ({
  TaskWebSocketServer: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  })),
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

vi.mock('http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('http')>();
  let createServerCount = 0;
  return {
    ...actual,
    createServer: vi.fn(() => {
      createServerCount++;
      const isFirstCall = createServerCount === 1;
      if (isFirstCall) {
        const error = Object.assign(new Error('listen EADDRINUSE: address already in use 127.0.0.1:5173'), {
          code: 'EADDRINUSE',
          errno: -48,
          syscall: 'listen',
          address: '127.0.0.1',
          port: 5173,
        });
        return {
          listen: vi.fn(() => {
            throw error;
          }),
          close: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
        };
      }
      return {
        listen: vi.fn((_port: number, _host: string, cb?: () => void) => {
          if (cb) cb();
        }),
        close: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
      };
    }),
  };
});

describe('dashboard command', () => {
  it('should handle port already in use by selecting an available port', async () => {
    const { Command } = await import('commander');
    const { dashboardCommand } = await import('./dashboard.js');
    const colorsModule = await import('../lib/colors.js');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const program = new Command();
    dashboardCommand(program);

    await program.parseAsync(['node', 'taskin', 'dashboard']);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(colorsModule.info).toHaveBeenCalledWith('Port 5173 is in use, trying port 5174...');
    expect(colorsModule.warning).toHaveBeenCalledWith('Port 5173 was in use. Dashboard started on port 5174.');

    exitSpy.mockRestore();
  });
});
