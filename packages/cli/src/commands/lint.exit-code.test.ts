import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const lintMock = vi.fn();

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { lint: lintMock },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

const NO_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

const ATTACHMENT_ERROR = {
  file: 'TASKS/assets/task-001/blueprint.png',
  message: 'Attachment is 2100 KB, above the 300 KB limit.',
  severity: 'error' as const,
  fixable: false,
};

const FORMAT_ERROR = {
  file: 'TASKS/task-002-alvo.md',
  message: 'Metadata is written as sections.',
  severity: 'error' as const,
};

const withErrors = { valid: false, issues: [ATTACHMENT_ERROR], errorCount: 1, warningCount: 0, infoCount: 0 };
const clean = { valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 };

class ExitCalled extends Error {
  constructor(readonly code: number | undefined) {
    super(`process.exit(${code})`);
  }
}

describe('lint — exit code', () => {
  let output: string[];

  beforeEach(() => {
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      output.push(args.map(String).join(' '));
    });
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new ExitCalled(code === null || code === undefined ? undefined : Number(code));
    });
    lintMock.mockReset();
  });

  async function run(...args: string[]): Promise<{ exitCode: number; text: string }> {
    const { lintCommand } = await import('./lint.js');
    const program = new Command();
    lintCommand(program);
    let exitCode = 0;
    try {
      await program.parseAsync(['node', 'taskin', 'lint', ...args]);
    } catch (error) {
      if (!(error instanceof ExitCalled)) throw error;
      exitCode = error.code ?? 0;
    }
    return { exitCode, text: output.join('\n').replace(NO_COLOR, '') };
  }

  it('exits 1 without --fix when an error is found', async () => {
    lintMock.mockResolvedValue(withErrors);

    expect((await run()).exitCode).toBe(1);
  });

  it('exits 1 with --fix when an error survives the fix', async () => {
    lintMock.mockResolvedValue(withErrors);

    expect((await run('--fix')).exitCode).toBe(1);
  });

  it('exits 0 with --fix when nothing is left', async () => {
    lintMock.mockResolvedValue(clean);

    expect((await run('--fix')).exitCode).toBe(0);
  });

  it('says that --fix could not correct what is left, instead of staying silent', async () => {
    lintMock.mockResolvedValue(withErrors);

    const { text } = await run('--fix');

    expect(text).toMatch(/1 error\(s\) left that --fix cannot correct/);
    expect(text).not.toContain('Run with --fix');
  });

  it('does not suggest --fix when no error is fixable', async () => {
    lintMock.mockResolvedValue(withErrors);

    const { exitCode, text } = await run();

    expect(exitCode).toBe(1);
    expect(text).not.toContain('Run with --fix');
  });

  it('still suggests --fix when some error may be fixable', async () => {
    lintMock.mockResolvedValue({ ...withErrors, issues: [ATTACHMENT_ERROR, FORMAT_ERROR], errorCount: 2 });

    expect((await run()).text).toContain('Run with --fix');
  });
});
