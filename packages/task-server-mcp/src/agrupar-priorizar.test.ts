import { type IGroupRegistry, type ITaskProvider, TaskManager } from '@opentask/taskin-task-manager';
import { type Group, parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

const tarefa = (id: string, extra: Partial<Task> = {}): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', ...extra }) as Task;

const CLI: Group = { id: parseGroupId('g-cli'), name: 'CLI' };

/**
 * Um manager de verdade sobre um provider em memoria: o que se testa aqui e o
 * servidor falando com o dominio, e nao um manager inventado para o teste.
 */
function montar(tarefas: Task[], grupos?: Group[]) {
  const porId = new Map(tarefas.map((t) => [String(t.id), t]));
  const registro: IGroupRegistry | undefined = grupos && {
    listGroups: async () => grupos,
    findGroup: async (id) => grupos.find((g) => g.id === id),
    createGroup: async () => {},
    renameGroup: async () => {},
    deleteGroup: async () => ({ reassigned: 0 }),
  };
  const provider: ITaskProvider & { groupRegistry?: IGroupRegistry } = {
    initialize: async () => {},
    findTask: async (id) => porId.get(String(id)),
    getAllTasks: async () => [...porId.values()],
    updateTask: async (t) => {
      porId.set(String(t.id), t);
    },
    createTask: async () => {
      throw new Error('nao usado');
    },
    lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    ...(registro && { groupRegistry: registro }),
  };

  return { servidor: new TaskMCPServer({ taskManager: new TaskManager(provider) }), porId };
}

const texto = (r: { content: Array<{ text?: string }> }) => r.content[0]?.text ?? '';
const nomes = (s: TaskMCPServer) => s.listTools().tools.map((t) => t.name);

/**
 * Um agente que fala MCP precisa conseguir organizar a fila que ele mesmo
 * executa (task-105). Antes havia `list_groups` e `prioritize_tasks`, e nada
 * que movesse uma tarefa para um grupo ou lhe desse um numero.
 */
describe('agrupar por MCP', () => {
  it('join_group poe a tarefa no grupo', async () => {
    const { servidor, porId } = montar([tarefa('001')], [CLI]);

    const r = await servidor.callTool({ name: 'join_group', arguments: { taskId: '001', groupId: 'g-cli' } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('001')?.groupId).toBe('g-cli');
    expect(JSON.parse(texto(r)).task.groupId).toBe('g-cli');
  });

  it('leave_group tira a tarefa do grupo', async () => {
    const { servidor, porId } = montar([tarefa('001', { groupId: CLI.id })], [CLI]);

    const r = await servidor.callTool({ name: 'leave_group', arguments: { taskId: '001' } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('001')?.groupId).toBeUndefined();
  });

  it('recusa um grupo que nao existe, dizendo qual', async () => {
    const { servidor } = montar([tarefa('001')], [CLI]);

    const r = await servidor.callTool({ name: 'join_group', arguments: { taskId: '001', groupId: 'g-sumiu' } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('g-sumiu');
  });

  it('recusa uma tarefa que nao existe', async () => {
    const { servidor } = montar([tarefa('001')], [CLI]);

    const r = await servidor.callTool({ name: 'join_group', arguments: { taskId: '999', groupId: 'g-cli' } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('999');
  });

  /*
   * A capacidade e opcional (task-079): quem nao tem nao anuncia. E quem chama
   * mesmo assim recebe uma frase, e nao um erro torto.
   */
  it('um provider sem grupos nao anuncia as ferramentas, e recusa em uma frase', async () => {
    const { servidor } = montar([tarefa('001')]);

    expect(nomes(servidor)).not.toContain('join_group');
    expect(nomes(servidor)).not.toContain('leave_group');

    const r = await servidor.callTool({ name: 'join_group', arguments: { taskId: '001', groupId: 'g-cli' } });
    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('does not support task groups');
  });

  it('com grupos, anuncia as duas', () => {
    const { servidor } = montar([tarefa('001')], [CLI]);

    expect(nomes(servidor)).toEqual(expect.arrayContaining(['join_group', 'leave_group']));
  });
});

describe('priorizar por MCP', () => {
  it('set_priority com numero grava o numero', async () => {
    const { servidor, porId } = montar([tarefa('001')]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '001', priority: 42 } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('001')?.order).toBe(42);
  });

  it('set_priority com before poe a tarefa na frente da referencia', async () => {
    const { servidor, porId } = montar([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '002', before: '001' } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('002')?.order).toBeLessThan(100);
    expect(JSON.parse(texto(r)).changed).toBe(1);
  });

  it('set_priority com after poe a tarefa atras da referencia', async () => {
    const { servidor, porId } = montar([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    await servidor.callTool({ name: 'set_priority', arguments: { taskId: '001', after: '002' } });

    expect(porId.get('001')?.order).toBeGreaterThan(200);
  });

  it('recusa prioridade fora da faixa', async () => {
    const { servidor, porId } = montar([tarefa('001')]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '001', priority: 0 } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('whole number from 1');
    expect(porId.get('001')?.order).toBeUndefined();
  });

  it('exige exatamente uma forma: priority, before ou after', async () => {
    const { servidor } = montar([tarefa('001'), tarefa('002')]);

    const nenhuma = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '001' } });
    const duas = await servidor.callTool({
      name: 'set_priority',
      arguments: { taskId: '001', priority: 5, before: '002' },
    });

    expect(nenhuma.isError).toBe(true);
    expect(duas.isError).toBe(true);
    expect(texto(duas)).toContain('exactly one');
  });

  it('set_priority com top leva a tarefa a frente da fila, e diz quantas gravou', async () => {
    const { servidor, porId } = montar([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '002', top: true } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('002')?.order).toBeLessThan(100);
    expect(JSON.parse(texto(r)).changed).toBe(1);
  });

  it('set_priority com bottom numera a cauda sem numero, e diz quantas gravou', async () => {
    const { servidor, porId } = montar([
      tarefa('001', { order: 100 }),
      tarefa('002', { order: 200 }),
      tarefa('003'),
      tarefa('004'),
    ]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '001', bottom: true } });

    expect(JSON.parse(texto(r)).changed).toBe(3);
    expect(porId.get('001')?.order).toBeGreaterThan(porId.get('004')?.order ?? Number.POSITIVE_INFINITY);
  });

  it('top e bottom contam como forma: nao combinam com outra', async () => {
    const { servidor, porId } = montar([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    const r = await servidor.callTool({
      name: 'set_priority',
      arguments: { taskId: '002', top: true, after: '001' },
    });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('exactly one');
    expect(porId.get('002')?.order).toBe(200);
  });

  it('top ou bottom que nao seja true e recusado, sem gravar', async () => {
    const { servidor, porId } = montar([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    const r = await servidor.callTool({ name: 'set_priority', arguments: { taskId: '002', top: 'yes' } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('`top`');
    expect(porId.get('002')?.order).toBe(200);
  });

  it('set_priority e anunciado mesmo sem grupos', () => {
    expect(nomes(montar([]).servidor)).toContain('set_priority');
  });
});

/**
 * Pontuar por MCP (task-115): o agente que chega na fila do `unscored` consegue
 * pontuar o que encontra.
 */
describe('pontuar por MCP', () => {
  it('set_difficulty grava a dificuldade e a devolve', async () => {
    const { servidor, porId } = montar([tarefa('001')]);

    const r = await servidor.callTool({ name: 'set_difficulty', arguments: { taskId: '001', difficulty: 4 } });

    expect(r.isError).toBeFalsy();
    expect(porId.get('001')?.difficulty).toBe(4);
    expect(JSON.parse(texto(r)).task.difficulty).toBe(4);
  });

  it('a tarefa pontuada sai do unscored', async () => {
    const { servidor } = montar([tarefa('001'), tarefa('002')]);

    await servidor.callTool({ name: 'set_difficulty', arguments: { taskId: '001', difficulty: 2 } });
    const r = await servidor.callTool({ name: 'list_tasks', arguments: { unscored: true } });

    expect(JSON.parse(texto(r)).map((t: { id: string }) => t.id)).toEqual(['002']);
  });

  it.each([0, 6, 2.5, '3', undefined])('recusa %j dizendo a faixa, sem gravar', async (difficulty) => {
    const { servidor, porId } = montar([tarefa('001', { difficulty: 1 })]);

    const r = await servidor.callTool({ name: 'set_difficulty', arguments: { taskId: '001', difficulty } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toMatch(/1 to 5/);
    expect(porId.get('001')?.difficulty).toBe(1);
  });

  it('recusa uma tarefa que nao existe', async () => {
    const { servidor } = montar([tarefa('001')]);

    const r = await servidor.callTool({ name: 'set_difficulty', arguments: { taskId: '999', difficulty: 3 } });

    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('999');
  });

  it('set_difficulty e anunciado mesmo sem grupos', () => {
    expect(nomes(montar([]).servidor)).toContain('set_difficulty');
  });
});
