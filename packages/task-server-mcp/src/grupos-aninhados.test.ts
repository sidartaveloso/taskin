import { type ITaskProvider, NESTING_NOT_SUPPORTED, TaskManager } from '@opentask/taskin-task-manager';
import { registroDeGruposEmMemoria } from '@opentask/taskin-task-manager/testing';
import { type Group, parseGroupId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

const PAI: Group = { id: parseGroupId('g-pai'), name: 'Pai' };
const SUB: Group = { id: parseGroupId('g-sub'), name: 'Sub' };

/** Um manager de verdade, sobre um registro em memoria com aninhamento. */
function montar(grupos: Group[], { aninhamento = true } = {}) {
  const registro = registroDeGruposEmMemoria(grupos);
  const { setParent: _sem, ...semAninhamento } = registro;
  const provider: ITaskProvider & { groupRegistry: unknown } = {
    initialize: async () => {},
    findTask: async () => undefined,
    getAllTasks: async () => [],
    updateTask: async () => {},
    createTask: async () => {
      throw new Error('nao usado');
    },
    lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    groupRegistry: aninhamento ? registro : semAninhamento,
  };
  return { servidor: new TaskMCPServer({ taskManager: new TaskManager(provider) }), registro };
}

const texto = (r: { content: Array<{ text?: string }> }) => r.content[0]?.text ?? '';
const nomes = (s: TaskMCPServer) => s.listTools().tools.map((t) => t.name);

/*
 * Grupo dentro de grupo pelo MCP (task-119): as mesmas operacoes que a CLI e
 * o dashboard usam, e `list_groups` dizendo o pai.
 */
describe('grupos aninhados por MCP', () => {
  it('create_group cria na raiz, ou ja dentro de outro', async () => {
    const { servidor, registro } = montar([PAI]);

    const r = await servidor.callTool({
      name: 'create_group',
      arguments: { name: 'Sub', id: 'g-sub', parentId: 'g-pai' },
    });

    expect(r.isError).toBeFalsy();
    expect(JSON.parse(texto(r)).group).toEqual({ id: 'g-sub', name: 'Sub', parentId: 'g-pai' });
    expect(registro.grupos.find((g) => g.id === 'g-sub')?.parentId).toBe('g-pai');
  });

  it('create_group exige um nome', async () => {
    const { servidor } = montar([]);

    const r = await servidor.callTool({ name: 'create_group', arguments: {} });

    expect(r.isError).toBe(true);
    expect(texto(r)).toMatch(/name/);
  });

  it('nest_group e unnest_group mudam o pai, e list_groups o mostra', async () => {
    const { servidor } = montar([PAI, SUB]);

    const aninhado = await servidor.callTool({
      name: 'nest_group',
      arguments: { groupId: 'g-sub', parentId: 'g-pai' },
    });
    expect(aninhado.isError).toBeFalsy();
    const lista = JSON.parse(texto(await servidor.callTool({ name: 'list_groups', arguments: {} })));
    expect(lista.groups).toContainEqual({ id: 'g-sub', name: 'Sub', parentId: 'g-pai' });

    const solto = await servidor.callTool({ name: 'unnest_group', arguments: { groupId: 'g-sub' } });
    expect(JSON.parse(texto(solto)).group).toEqual({ id: 'g-sub', name: 'Sub' });
  });

  it('recusa o ciclo com a frase do dominio', async () => {
    const { servidor } = montar([PAI, { ...SUB, parentId: PAI.id }]);

    const r = await servidor.callTool({ name: 'nest_group', arguments: { groupId: 'g-pai', parentId: 'g-sub' } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toMatch(/cycle/);
  });

  it('sem aninhamento no provider, nest_group e unnest_group nao sao anunciadas', () => {
    const { servidor } = montar([PAI], { aninhamento: false });

    expect(nomes(servidor)).toContain('create_group');
    expect(nomes(servidor)).not.toContain('nest_group');
    expect(nomes(servidor)).not.toContain('unnest_group');
  });

  it('sem aninhamento, create_group com pai recusa em uma frase', async () => {
    const { servidor } = montar([PAI], { aninhamento: false });

    const r = await servidor.callTool({ name: 'create_group', arguments: { name: 'Sub', parentId: 'g-pai' } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain(NESTING_NOT_SUPPORTED);
  });
});
