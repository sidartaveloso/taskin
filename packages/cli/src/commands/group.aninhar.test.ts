import type { IGroupRegistry } from '@opentask/taskin-task-manager';
import { registroDeGruposEmMemoria } from '@opentask/taskin-task-manager/testing';
import type { Group } from '@opentask/taskin-types';
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* O registro que o provider falso expoe; cada teste troca. */
let groupRegistry: IGroupRegistry;

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: {
      findTask: vi.fn(async () => undefined),
      getAllTasks: vi.fn(async () => []),
      updateTask: vi.fn(),
      get groupRegistry() {
        return groupRegistry;
      },
    },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

const grupo = (id: string, name: string, parentId?: string) =>
  ({ id, name, ...(parentId && { parentId }) }) as unknown as Group;

/**
 * Grupo dentro de grupo pela CLI (task-119). Tudo passa pelo manager: a regra
 * — pai existe, sem ciclo, ate quatro niveis — mora no dominio.
 */
describe('taskin group com grupos aninhados', () => {
  let linhas: string[];
  let memoria: ReturnType<typeof registroDeGruposEmMemoria>;

  beforeEach(() => {
    linhas = [];
    memoria = registroDeGruposEmMemoria([grupo('g-pai', 'Pai')]);
    groupRegistry = memoria;
    const guardar = (...args: unknown[]) => {
      linhas.push(args.map(String).join(' '));
    };
    vi.spyOn(console, 'log').mockImplementation(guardar);
    vi.spyOn(console, 'error').mockImplementation(guardar);
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
  });

  async function rodar(...argv: string[]): Promise<string> {
    const { registerGroupCommand } = await import('./group.js');
    const program = new Command();
    registerGroupCommand(program);
    await program.parseAsync(['node', 'taskin', 'group', ...argv]);
    return linhas.join('\n');
  }

  it('create --parent nasce dentro do pai, e diz qual', async () => {
    const saida = await rodar('create', 'Sub', '--id', 'g-sub', '--parent', 'g-pai');

    expect(memoria.grupos.find((g) => g.id === 'g-sub')?.parentId).toBe('g-pai');
    expect(saida).toContain('g-sub');
    expect(saida).toContain('inside g-pai');
  });

  it('add continua criando, como apelido de create', async () => {
    await rodar('add', 'Outro', '--id', 'g-outro');

    expect(memoria.grupos.map((g) => g.id)).toContain('g-outro');
  });

  it('create sem --id gera um id g-xxxxxxxx', async () => {
    const saida = await rodar('create', 'Sem id');

    expect(saida).toMatch(/g-[a-z0-9]+/);
    expect(memoria.grupos).toHaveLength(2);
  });

  it('create --parent com pai inexistente recusa em uma linha, sem criar', async () => {
    await expect(rodar('create', 'Sub', '--id', 'g-sub', '--parent', 'g-sumiu')).rejects.toThrow('exit 1');

    expect(linhas.join('\n')).toContain('g-sumiu');
    expect(memoria.grupos.map((g) => g.id)).toEqual(['g-pai']);
  });

  it('nest poe o grupo dentro do outro, e unnest o devolve a raiz', async () => {
    await memoria.createGroup(grupo('g-sub', 'Sub'));

    expect(await rodar('nest', 'g-sub', 'g-pai')).toContain('g-pai');
    expect(memoria.grupos.find((g) => g.id === 'g-sub')?.parentId).toBe('g-pai');

    expect(await rodar('unnest', 'g-sub')).toContain('top level');
    expect(memoria.grupos.find((g) => g.id === 'g-sub')?.parentId).toBeUndefined();
  });

  it('nest recusa o ciclo com saida 1', async () => {
    await memoria.createGroup(grupo('g-sub', 'Sub', 'g-pai'));

    await expect(rodar('nest', 'g-pai', 'g-sub')).rejects.toThrow('exit 1');

    expect(memoria.grupos.find((g) => g.id === 'g-pai')?.parentId).toBeUndefined();
  });

  it('num registro sem setParent, nest diz em uma frase que nao ha aninhamento', async () => {
    const { setParent: _semAninhar, ...semAninhar } = memoria;
    groupRegistry = semAninhar;

    await expect(rodar('nest', 'g-pai', 'g-pai')).rejects.toThrow('exit 1');

    expect(linhas.join('\n')).toContain('not groups inside groups');
  });

  it('list mostra a hierarquia, com o subgrupo indentado logo abaixo do pai', async () => {
    memoria.grupos.push(grupo('g-solto', 'Solto'), grupo('g-sub', 'Sub', 'g-pai'), grupo('g-neto', 'Neto', 'g-sub'));

    const saida = await rodar('list');
    const texto = saida.split('\n');
    const linha = (id: string) => texto.findIndex((l) => l.includes(id));

    expect(texto[linha('g-pai')]).toMatch(/^ {2}\S*g-pai/);
    expect(texto[linha('g-sub')]).toMatch(/^ {4}\S*g-sub/);
    expect(texto[linha('g-neto')]).toMatch(/^ {6}\S*g-neto/);
    expect(linha('g-sub')).toBe(linha('g-pai') + 1);
    expect(linha('g-neto')).toBe(linha('g-sub') + 1);
    expect(saida).toContain('4 group(s)');
  });

  it('list mostra na raiz o grupo cujo pai sumiu', async () => {
    memoria.grupos.push(grupo('g-orfao', 'Orfao', 'g-sumiu'));

    const texto = (await rodar('list')).split('\n');

    expect(texto.find((l) => l.includes('g-orfao'))).toMatch(/^ {2}\S*g-orfao/);
  });

  it('remove diz que os subgrupos subiram para o pai do apagado', async () => {
    memoria.grupos.push(grupo('g-sub', 'Sub', 'g-pai'), grupo('g-neto', 'Neto', 'g-sub'));

    const saida = await rodar('remove', 'g-sub');

    expect(memoria.grupos.find((g) => g.id === 'g-neto')?.parentId).toBe('g-pai');
    expect(saida).toContain('1 subgroup(s) moved up to g-pai');
  });

  it('remove diz que os subgrupos foram para a raiz quando o apagado era da raiz', async () => {
    memoria.grupos.push(grupo('g-sub', 'Sub', 'g-pai'));

    expect(await rodar('remove', 'g-pai')).toContain('1 subgroup(s) moved up to the top level');
  });
});
