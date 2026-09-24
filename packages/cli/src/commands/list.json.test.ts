import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllTasks = vi.fn();

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { getAllTasks },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

const ANA = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };

function tarefa(parcial: Record<string, unknown>) {
  return {
    createdAt: '2026-09-12T00:00:00.000Z',
    status: 'pending',
    title: 'Uma tarefa',
    type: 'feat',
    // O provider de arquivos carrega o markdown inteiro nestes dois campos.
    content: '# Uma tarefa\n\n- Status: pending\n\n## Description\n(corpo longo)',
    description: '(corpo longo)',
    filePath: '/tmp/taskin-test/TASKS/task-001-uma-tarefa.md',
    ...parcial,
  };
}

/**
 * `taskin list --json`.
 *
 * A seam e a saida do comando: o teste le o stdout e faz `JSON.parse`. Nada de
 * espiar o interior — o que importa e que uma ferramenta de fora consiga
 * consumir, que era o que faltava para o CLI compor com qualquer coisa.
 */
describe('list --json', () => {
  let saida: string[];

  beforeEach(() => {
    saida = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      saida.push(args.map(String).join(' '));
    });
    getAllTasks.mockReset();
  });

  async function rodar(...argv: string[]): Promise<string> {
    const { listCommand } = await import('./list.js');
    const program = new Command();
    listCommand(program);
    await program.parseAsync(['node', 'taskin', 'list', ...argv]);
    return saida.join('\n');
  }

  it('imprime JSON puro, sem cabecalho nem moldura', async () => {
    getAllTasks.mockResolvedValue([tarefa({ id: '001' })]);

    const texto = await rodar('--json');

    expect(() => JSON.parse(texto)).not.toThrow();
    expect(texto).not.toContain('Task List');
    expect(texto).not.toContain('─');
  });

  it('devolve um arranjo com os campos que identificam a tarefa', async () => {
    getAllTasks.mockResolvedValue([
      tarefa({ id: '001', title: 'Criar login', status: 'in-progress', type: 'feat', assignee: ANA }),
    ]);

    const [primeira] = JSON.parse(await rodar('--json'));

    expect(primeira).toMatchObject({
      id: '001',
      title: 'Criar login',
      status: 'in-progress',
      type: 'feat',
      assignee: { id: 'ana-souza', name: 'Ana Souza' },
    });
  });

  it('nao carrega o corpo do markdown na listagem', async () => {
    getAllTasks.mockResolvedValue([tarefa({ id: '001' })]);

    const [primeira] = JSON.parse(await rodar('--json'));

    expect(primeira).not.toHaveProperty('content');
    expect(primeira).not.toHaveProperty('description');
    expect(primeira).not.toHaveProperty('filePath');
  });

  it('respeita os mesmos filtros da listagem em tabela', async () => {
    getAllTasks.mockResolvedValue([tarefa({ id: '001', status: 'pending' }), tarefa({ id: '002', status: 'done' })]);

    const tarefas = JSON.parse(await rodar('--json', '--status', 'done'));

    expect(tarefas.map((t: { id: string }) => t.id)).toEqual(['002']);
  });

  it('devolve arranjo vazio quando nada casa, e nao uma mensagem', async () => {
    getAllTasks.mockResolvedValue([tarefa({ id: '001', status: 'pending' })]);

    const texto = await rodar('--json', '--status', 'done');

    expect(JSON.parse(texto)).toEqual([]);
  });

  /*
   * O padrao e o `--all` vem do dominio, pela derivacao: este comando nao tem
   * regra propria. O teste passa pela linha de comando para provar que a flag
   * emergiu do schema e que a saida de maquina segue o mesmo padrao.
   */
  describe('so as abertas por padrao', () => {
    const MISTURA = [
      tarefa({ id: '001', status: 'pending' }),
      tarefa({ id: '002', status: 'done' }),
      tarefa({ id: '003', status: 'in-progress' }),
      tarefa({ id: '004', status: 'canceled' }),
    ];
    const ids = async (...argv: string[]) =>
      JSON.parse(await rodar('--json', ...argv)).map((t: { id: string }) => t.id);

    beforeEach(() => {
      getAllTasks.mockResolvedValue(MISTURA);
    });

    it('sem criterio, devolve so as abertas', async () => {
      expect(await ids()).toEqual(['001', '003']);
    });

    it('`--all` devolve todas', async () => {
      expect(await ids('--all')).toEqual(['001', '002', '003', '004']);
    });

    it('`--open` continua aceito', async () => {
      expect(await ids('--open')).toEqual(['001', '003']);
    });

    it('`--closed` devolve o mesmo de antes, sem intersectar com o padrao', async () => {
      expect(await ids('--closed')).toEqual(['002', '004']);
    });

    it('`--active` devolve o mesmo de antes, sem intersectar com o padrao', async () => {
      expect(await ids('--active')).toEqual(['003']);
    });

    it('`--status done` devolve as concluidas, e nao lista vazia', async () => {
      expect(await ids('--status', 'done')).toEqual(['002']);
    });

    it('a saida em tabela segue o mesmo padrao', async () => {
      const texto = await rodar();

      expect(texto).toMatch(/\b001\b/);
      expect(texto).not.toMatch(/\b002\b/);
    });

    it('recusa `--all` com `--open`', async () => {
      const sair = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await rodar('--json', '--all', '--open');

      expect(sair).toHaveBeenCalledWith(1);
      expect(erro.mock.calls.flat().join(' ')).toMatch(/`all` cannot be combined with `open`/);
      sair.mockRestore();
      erro.mockRestore();
    });
  });
});
