import { type Group, type GroupId, parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import type { IGroupRegistry } from './group-registry.types';
import { TaskManager } from './task-manager';
import type { ITaskProvider } from './task-manager.types';

const tarefa = (id: string, extra: Partial<Task> = {}): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', ...extra }) as Task;

/**
 * Um provider em memoria que conta as gravacoes — o custo de uma operacao de
 * prioridade e medido em arquivos escritos.
 */
function emMemoria(tarefas: Task[], grupos?: Group[]) {
  const porId = new Map(tarefas.map((t) => [String(t.id), t]));
  const gravadas: string[] = [];

  const registro: IGroupRegistry | undefined = grupos && {
    listGroups: async () => grupos,
    findGroup: async (id: GroupId) => grupos.find((g) => g.id === id),
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
      gravadas.push(String(t.id));
    },
    createTask: async () => {
      throw new Error('nao usado');
    },
    lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    ...(registro && { groupRegistry: registro }),
  };

  return { manager: new TaskManager(provider), porId, gravadas };
}

const g = parseGroupId('g-cli');

/**
 * Agrupar e priorizar como operacoes de dominio nomeadas (task-105), e nao
 * como efeito colateral de um `updateTask` generico — e o que deixa a CLI e o
 * servidor MCP oferecerem a mesma coisa sem cada um reescrever a regra.
 */
describe('TaskManager — agrupar', () => {
  it('assignToGroup grava o id do grupo na tarefa', async () => {
    const { manager, porId } = emMemoria([tarefa('001')], [{ id: g, name: 'CLI' }]);

    const task = await manager.assignToGroup(parseTaskId('001'), g);

    expect(task.groupId).toBe('g-cli');
    expect(porId.get('001')?.groupId).toBe('g-cli');
  });

  it('recusa um grupo que nao existe, dizendo qual', async () => {
    const { manager, gravadas } = emMemoria([tarefa('001')], [{ id: g, name: 'CLI' }]);

    await expect(manager.assignToGroup(parseTaskId('001'), parseGroupId('g-sumiu'))).rejects.toThrow(/g-sumiu/);
    expect(gravadas).toEqual([]);
  });

  it('recusa uma tarefa que nao existe', async () => {
    const { manager } = emMemoria([tarefa('001')], [{ id: g, name: 'CLI' }]);

    await expect(manager.assignToGroup(parseTaskId('999'), g)).rejects.toThrow("Task with ID '999' not found.");
  });

  it('removeFromGroup tira a tarefa do grupo', async () => {
    const { manager, porId } = emMemoria([tarefa('001', { groupId: g })], [{ id: g, name: 'CLI' }]);

    await manager.removeFromGroup(parseTaskId('001'));

    expect(porId.get('001')?.groupId).toBeUndefined();
  });

  it('um provider sem grupos recusa as duas em uma frase', async () => {
    const { manager } = emMemoria([tarefa('001')]);

    await expect(manager.assignToGroup(parseTaskId('001'), g)).rejects.toThrow(/does not support task groups/);
    await expect(manager.removeFromGroup(parseTaskId('001'))).rejects.toThrow(/does not support task groups/);
  });
});

describe('TaskManager — priorizar', () => {
  it('setPriority grava o numero, e so naquele arquivo', async () => {
    const { manager, porId, gravadas } = emMemoria([tarefa('001', { order: 100 }), tarefa('002')]);

    await manager.setPriority(parseTaskId('002'), 50);

    expect(porId.get('002')?.order).toBe(50);
    expect(gravadas).toEqual(['002']);
  });

  it('setPriority recusa fora da faixa sem gravar', async () => {
    const { manager, gravadas } = emMemoria([tarefa('001')]);

    await expect(manager.setPriority(parseTaskId('001'), 0)).rejects.toThrow(/whole number from 1/);
    expect(gravadas).toEqual([]);
  });

  it('moveBefore poe a tarefa na frente da referencia, e grava so o que mudou', async () => {
    const { manager, porId, gravadas } = emMemoria([
      tarefa('001', { order: 100 }),
      tarefa('002', { order: 200 }),
      tarefa('003', { order: 300 }),
    ]);

    const { task, changed } = await manager.moveBefore(parseTaskId('003'), parseTaskId('002'));

    expect(changed).toBe(1);
    expect(gravadas).toEqual(['003']);
    expect(task.order).toBe(porId.get('003')?.order);
    expect(task.order).toBeGreaterThan(100);
    expect(task.order).toBeLessThan(200);
  });

  it('moveAfter poe a tarefa atras da referencia', async () => {
    const { manager, porId } = emMemoria([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    await manager.moveAfter(parseTaskId('001'), parseTaskId('002'));

    expect(porId.get('001')?.order).toBeGreaterThan(200);
  });

  it('move recusa uma referencia que nao existe', async () => {
    const { manager } = emMemoria([tarefa('001', { order: 100 })]);

    await expect(manager.moveAfter(parseTaskId('001'), parseTaskId('999'))).rejects.toThrow(/999/);
  });
});
