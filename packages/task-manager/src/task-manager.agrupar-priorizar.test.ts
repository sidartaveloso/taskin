import { type Group, type GroupId, parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import type { IGroupRegistry } from './group-registry.types';
import { GROUPS_NOT_SUPPORTED, NESTING_NOT_SUPPORTED, TaskManager } from './task-manager';
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

/**
 * Topo e fim como operacoes nomeadas (task-114): o atalho mais rotineiro da
 * priorizacao, sem precisar descobrir antes qual e a primeira da fila.
 */
describe('TaskManager — topo e fim', () => {
  it('moveToTop poe a tarefa a frente de todas, e grava um arquivo', async () => {
    const { manager, porId, gravadas } = emMemoria([
      tarefa('001', { order: 100 }),
      tarefa('002', { order: 200 }),
      tarefa('003', { order: 300 }),
    ]);

    const { task, changed } = await manager.moveToTop(parseTaskId('003'));

    expect(changed).toBe(1);
    expect(gravadas).toEqual(['003']);
    expect(task.order).toBe(porId.get('003')?.order);
    expect(task.order).toBeLessThan(100);
  });

  it('moveToBottom numera a cauda sem numero uma vez, e diz quantas gravou', async () => {
    const { manager, porId, gravadas } = emMemoria([
      tarefa('001', { order: 100 }),
      tarefa('002', { order: 200 }),
      tarefa('003'),
      tarefa('004'),
    ]);

    const { changed } = await manager.moveToBottom(parseTaskId('001'));

    expect(changed).toBe(3);
    expect([...gravadas].sort()).toEqual(['001', '003', '004']);
    expect(porId.get('001')?.order).toBeGreaterThan(porId.get('004')?.order ?? Number.POSITIVE_INFINITY);

    gravadas.length = 0;
    expect((await manager.moveToBottom(parseTaskId('002'))).changed).toBe(1);
  });

  it('agrupada vai ao extremo do proprio grupo', async () => {
    const { manager, porId } = emMemoria([
      tarefa('001', { order: 100, groupId: g }),
      tarefa('002', { order: 200, groupId: g }),
      tarefa('003', { order: 300 }),
    ]);

    await manager.moveToBottom(parseTaskId('001'));

    expect(porId.get('001')?.order).toBeGreaterThan(200);
    expect(porId.get('001')?.order).toBeLessThan(300);
  });

  it('quem ja esta no extremo nao grava nada', async () => {
    const { manager, gravadas } = emMemoria([tarefa('001', { order: 100 }), tarefa('002', { order: 200 })]);

    const { task, changed } = await manager.moveToTop(parseTaskId('001'));

    expect(changed).toBe(0);
    expect(gravadas).toEqual([]);
    expect(task.order).toBe(100);
  });

  it('recusa uma tarefa que nao existe', async () => {
    const { manager } = emMemoria([tarefa('001', { order: 100 })]);

    await expect(manager.moveToTop(parseTaskId('999'))).rejects.toThrow(/999/);
    await expect(manager.moveToBottom(parseTaskId('999'))).rejects.toThrow(/999/);
  });
});

/**
 * Mover um grupo inteiro como operacao nomeada (task-117): o que so o
 * dashboard fazia, agora no contrato — e dali na CLI e no MCP.
 */
describe('TaskManager — mover um grupo', () => {
  const outro = parseGroupId('g-outro');
  const grupos = [
    { id: g, name: 'CLI' },
    { id: outro, name: 'Outro' },
  ];
  const fila = (porId: Map<string, Task>) =>
    [...porId.values()]
      .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY))
      .map((t) => String(t.id));

  it('moveGroupToTop leva o bloco a frente, e grava so os membros: grupo de 3 grava 3', async () => {
    const { manager, porId, gravadas } = emMemoria(
      [
        tarefa('001', { order: 100 }),
        tarefa('002', { order: 200, groupId: g }),
        tarefa('003', { order: 300, groupId: g }),
        tarefa('004', { order: 400, groupId: g }),
      ],
      grupos,
    );

    const { members, changed } = await manager.moveGroupToTop(g);

    expect(changed).toBe(3);
    expect([...gravadas].sort()).toEqual(['002', '003', '004']);
    expect(members.map((t) => String(t.id))).toEqual(['002', '003', '004']);
    expect(fila(porId)).toEqual(['002', '003', '004', '001']);
  });

  it('moveGroupToBottom leva o bloco ao fim', async () => {
    const { manager, porId } = emMemoria(
      [tarefa('001', { order: 100, groupId: g }), tarefa('002', { order: 200 }), tarefa('003', { order: 300 })],
      grupos,
    );

    await manager.moveGroupToBottom(g);

    expect(fila(porId)).toEqual(['002', '003', '001']);
  });

  it('moveGroupBefore aceita uma tarefa solta ou outro grupo como alvo', async () => {
    const { manager, porId } = emMemoria(
      [
        tarefa('001', { order: 100, groupId: outro }),
        tarefa('002', { order: 200 }),
        tarefa('003', { order: 300, groupId: g }),
      ],
      grupos,
    );

    await manager.moveGroupBefore(g, parseTaskId('002'));
    expect(fila(porId)).toEqual(['001', '003', '002']);

    await manager.moveGroupBefore(g, outro);
    expect(fila(porId)).toEqual(['003', '001', '002']);
  });

  it('moveGroupAfter poe o bloco depois do alvo', async () => {
    const { manager, porId } = emMemoria(
      [
        tarefa('001', { order: 100, groupId: g }),
        tarefa('002', { order: 200, groupId: outro }),
        tarefa('003', { order: 300 }),
      ],
      grupos,
    );

    await manager.moveGroupAfter(g, outro);

    expect(fila(porId)).toEqual(['002', '001', '003']);
  });

  it('ja no lugar, nao grava nada', async () => {
    const { manager, gravadas } = emMemoria(
      [tarefa('001', { order: 100, groupId: g }), tarefa('002', { order: 200 })],
      grupos,
    );

    expect((await manager.moveGroupToTop(g)).changed).toBe(0);
    expect(gravadas).toEqual([]);
  });

  it('recusa grupo inexistente, alvo inexistente e alvo do proprio grupo, sem gravar', async () => {
    const { manager, gravadas } = emMemoria(
      [tarefa('001', { order: 100, groupId: g }), tarefa('002', { order: 200, groupId: g })],
      grupos,
    );

    await expect(manager.moveGroupToTop(parseGroupId('g-fantasma'))).rejects.toThrow(/g-fantasma/);
    await expect(manager.moveGroupBefore(g, parseTaskId('999'))).rejects.toThrow(/999/);
    await expect(manager.moveGroupBefore(g, parseGroupId('g-nada'))).rejects.toThrow(/g-nada/);
    await expect(manager.moveGroupAfter(g, parseTaskId('002'))).rejects.toThrow(/member/);
    expect(gravadas).toEqual([]);
  });

  it('um provider sem grupos recusa com a frase de sempre', async () => {
    const { manager } = emMemoria([tarefa('001', { order: 100 })]);

    await expect(manager.moveGroupToTop(g)).rejects.toThrow(GROUPS_NOT_SUPPORTED);
    await expect(manager.moveGroupBefore(g, parseTaskId('001'))).rejects.toThrow(GROUPS_NOT_SUPPORTED);
  });
});

/*
 * Grupo dentro de grupo e capacidade propria (task-119): um provider pode ter
 * grupos e nao ter aninhamento. O registro deste teste nao tem `setParent`.
 */
describe('TaskManager — aninhamento como capacidade', () => {
  it('um provider sem grupos recusa criar e aninhar com a frase de grupos', async () => {
    const { manager } = emMemoria([]);

    await expect(manager.createGroup('Sprint')).rejects.toThrow(GROUPS_NOT_SUPPORTED);
    await expect(manager.nestGroup(g, g)).rejects.toThrow(GROUPS_NOT_SUPPORTED);
  });

  it('um provider com grupos e sem aninhamento cria na raiz, e recusa o resto com uma frase', async () => {
    const { manager } = emMemoria([], [{ id: g, name: 'CLI' }]);

    await expect(manager.createGroup('Solto')).resolves.toMatchObject({ name: 'Solto' });
    await expect(manager.createGroup('Filho', { parentId: g })).rejects.toThrow(NESTING_NOT_SUPPORTED);
    await expect(manager.nestGroup(g, g)).rejects.toThrow(NESTING_NOT_SUPPORTED);
    await expect(manager.unnestGroup(g)).rejects.toThrow(NESTING_NOT_SUPPORTED);
  });
});
