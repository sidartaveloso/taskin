import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllTasks = vi.fn();

const GRUPOS = [
  { id: 'g-pai', name: 'Pai' },
  { id: 'g-sub', name: 'Sub', parentId: 'g-pai' },
];

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { getAllTasks, groupRegistry: { listGroups: async () => GRUPOS } },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

function tarefa(id: string, parcial: Record<string, unknown> = {}) {
  return {
    id,
    createdAt: '2026-09-24T00:00:00.000Z',
    status: 'pending',
    title: `Tarefa ${id}`,
    type: 'feat',
    ...parcial,
  };
}

/* 001 no pai, 002 no subgrupo, 003 solta, na ordem da fila. */
const FILA = [
  tarefa('001', { groupId: 'g-pai', order: 100 }),
  tarefa('002', { groupId: 'g-sub', order: 200 }),
  tarefa('003', { order: 300 }),
];

/**
 * `taskin list` com grupo dentro de grupo (task-119): a arvore do
 * `agruparTarefas` chega inteira as duas saidas, sem achatar.
 */
describe('taskin list com grupos aninhados', () => {
  let saida: string[];

  beforeEach(() => {
    saida = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      saida.push(args.map(String).join(' '));
    });
    getAllTasks.mockReset();
    getAllTasks.mockResolvedValue(FILA);
  });

  async function rodar(...argv: string[]): Promise<string> {
    const { listCommand } = await import('./list.js');
    const program = new Command();
    listCommand(program);
    await program.parseAsync(['node', 'taskin', 'list', ...argv]);
    return saida.join('\n');
  }

  it('--json aninha o subgrupo dentro do pai, com parentId', async () => {
    const [pai, solta] = JSON.parse(await rodar('--json'));

    expect(pai.group).toMatchObject({ id: 'g-pai', name: 'Pai', hidden: 0 });
    expect(pai.group.parentId).toBeUndefined();
    expect(pai.tasks.map((t: { id: string }) => t.id)).toEqual(['001']);
    expect(pai.groups).toHaveLength(1);
    expect(pai.groups[0].group).toMatchObject({ id: 'g-sub', name: 'Sub', parentId: 'g-pai' });
    expect(pai.groups[0].tasks.map((t: { id: string }) => t.id)).toEqual(['002']);
    expect(pai.groups[0].groups).toEqual([]);
    expect(solta).toMatchObject({ id: '003' });
  });

  it('o texto poe um cabecalho por grupo e indenta membros e subgrupos pelo nivel', async () => {
    const texto = (await rodar()).split('\n');
    const linha = (trecho: string) => texto.findIndex((l) => l.includes(trecho));

    expect(texto[linha('(g-pai)')]).toMatch(/^▸ Pai \(g-pai\)/);
    expect(texto[linha('Tarefa 001')]).toMatch(/^ {2}\S*001/);
    expect(texto[linha('(g-sub)')]).toMatch(/^ {2}▸ Sub \(g-sub\)/);
    expect(texto[linha('Tarefa 002')]).toMatch(/^ {4}\S*002/);
    expect(texto[linha('Tarefa 003')]).toMatch(/^\S*003/);
    expect(linha('(g-pai)')).toBeLessThan(linha('Tarefa 001'));
    expect(linha('Tarefa 001')).toBeLessThan(linha('(g-sub)'));
    expect(linha('(g-sub)')).toBeLessThan(linha('Tarefa 002'));
    expect(texto.join('\n')).toContain('Total: 3 tasks');
  });

  it('sem nenhuma tarefa em grupo, o texto continua a tabela plana', async () => {
    getAllTasks.mockResolvedValue([tarefa('001'), tarefa('002')]);

    const texto = await rodar();

    expect(texto).not.toContain('▸');
    expect(texto.split('\n').find((l) => l.includes('Tarefa 001'))).toMatch(/^\S*001/);
  });
});
