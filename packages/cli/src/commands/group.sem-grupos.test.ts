import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateTask = vi.fn();

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));

/* Um provider sem `groupRegistry`: a fonte nao tem o conceito de grupo. */
vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: {
      findTask: vi.fn(async (id: string) => ({ id, title: 'Uma', status: 'pending', type: 'feat' })),
      getAllTasks: vi.fn(async () => []),
      updateTask,
    },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'outro',
  })),
}));

/**
 * A capacidade de grupo e opcional (task-079). Num provider sem ela, `join` e
 * `leave` dizem isso em uma frase e saem com 1 — em vez de estourar tentando
 * gravar um campo que a fonte nao conhece.
 */
describe('taskin group join/leave num provider sem grupos', () => {
  let erros: string[];

  beforeEach(() => {
    erros = [];
    updateTask.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      erros.push(args.map(String).join(' '));
    });
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
  });

  async function rodar(...argv: string[]) {
    const { registerGroupCommand } = await import('./group.js');
    const program = new Command();
    registerGroupCommand(program);
    await program.parseAsync(['node', 'taskin', 'group', ...argv]);
  }

  it.each([
    ['join', '001', 'g-cli'],
    ['leave', '001'],
    ['move', 'g-cli', '--top'],
  ])('%s recusa em uma frase, sem gravar', async (...argv) => {
    await expect(rodar(...argv)).rejects.toThrow('exit 1');

    expect(erros.join('\n')).toContain('does not support task groups');
    expect(updateTask).not.toHaveBeenCalled();
  });
});
