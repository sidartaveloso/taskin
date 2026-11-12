import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllTasks = vi.fn();
const probeSituation = vi.fn();

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));
vi.mock('../lib/probe-situation.js', () => ({ probeSituation }));
vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { getAllTasks },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

function tarefa(parcial: Record<string, unknown>) {
  return { createdAt: '2026-09-12T00:00:00.000Z', status: 'pending', title: 'Uma', type: 'feat', ...parcial };
}

const VIEW = {
  observedAt: 1,
  resources: [
    {
      id: 'this-machine',
      name: 'this-machine',
      kind: 'machine',
      layer: 'personal',
      available: true,
      facts: [{ capability: 'docker', origin: 'probed', expired: false }],
    },
  ],
};

describe('list --where', () => {
  let saida: string[];

  beforeEach(() => {
    saida = [];
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      saida.push(a.map(String).join(' '));
    });
    getAllTasks.mockReset();
    probeSituation.mockReset();
    probeSituation.mockResolvedValue(VIEW);
    getAllTasks.mockResolvedValue([
      tarefa({ id: '001', requires: ['docker'] }),
      tarefa({ id: '002', requires: ['android-sdk'] }),
    ]);
  });

  async function rodar(...argv: string[]): Promise<string> {
    const { listCommand } = await import('./list.js');
    const program = new Command();
    listCommand(program);
    await program.parseAsync(['node', 'taskin', 'list', ...argv]);
    return saida.join('\n');
  }

  it('mostra a coluna no texto: ✓ aqui e ✗ falta <requisitos>', async () => {
    const texto = await rodar('--where');

    expect(texto).toContain('✓ aqui');
    expect(texto).toContain('✗ falta android-sdk');
    expect(probeSituation).toHaveBeenCalledTimes(1);
  });

  it('no json cada tarefa ganha runsHere e missing', async () => {
    const lista = JSON.parse(await rodar('--where', '--json'));

    expect(lista[0]).toMatchObject({ id: '001', runsHere: true, missing: [] });
    expect(lista[1]).toMatchObject({ id: '002', runsHere: false, missing: ['android-sdk'] });
  });

  it('sem --where nao sonda nada', async () => {
    const texto = await rodar('--json');

    expect(probeSituation).not.toHaveBeenCalled();
    expect(JSON.parse(texto)[0]).not.toHaveProperty('runsHere');
  });
});
