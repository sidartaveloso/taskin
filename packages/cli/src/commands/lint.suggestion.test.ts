import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lintMock = vi.fn();

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { lint: lintMock },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

/** Strips chalk colouring without writing the escape character in the source. */
const NO_COLOUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/*
 * A suggestion can span several lines — the attachment-size hint (task-108)
 * is one action per line, each with its command. Only the first line used to
 * be indented, so the rest read as if it were a new issue.
 */
describe('lint — multi-line suggestion', () => {
  let output: string[];

  beforeEach(() => {
    output = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      output.push(args.map(String).join(' '));
    });
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    lintMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function run(): Promise<string[]> {
    const { lintCommand } = await import('./lint.js');
    const program = new Command();
    lintCommand(program);
    await program.parseAsync(['node', 'taskin', 'lint']);
    return output.join('\n').replace(NO_COLOUR, '').split('\n');
  }

  it.each([['error'], ['warning']] as const)('indents every line of the suggestion of an %s', async (severity) => {
    lintMock.mockResolvedValue({
      valid: severity !== 'error',
      issues: [
        {
          file: 'TASKS/assets/flight.webm',
          message: 'over the limit',
          severity,
          suggestion: 'first action\nsecond action\nthird action',
        },
      ],
      errorCount: severity === 'error' ? 1 : 0,
      warningCount: severity === 'warning' ? 1 : 0,
      infoCount: 0,
    });

    const lines = await run();
    const first = lines.findIndex((line) => line.includes('first action'));

    expect(lines[first]).toBe('    ↳ first action');
    expect(lines[first + 1]).toBe('      second action');
    expect(lines[first + 2]).toBe('      third action');
  });
});
