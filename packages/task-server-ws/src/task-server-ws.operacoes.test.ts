import { type IGroupRegistry, type ITaskProvider, TaskManager } from '@opentask/taskin-task-manager';
import { registroDeGruposEmMemoria } from '@opentask/taskin-task-manager/testing';
import { type Group, type GroupId, parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { TaskWebSocketServer } from './task-server-ws.js';
import type { WSMessage } from './task-server-ws.types.js';

const tarefa = (id: string, extra: Partial<Task> = {}): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', ...extra }) as Task;

/**
 * Um provider em memoria, com registro de grupos, que anota cada `updateTask`
 * — e por ele que se ve o que o servidor gravou.
 */
function emMemoria(tarefas: Task[], grupos: Group[] = []) {
  const porId = new Map(tarefas.map((t) => [String(t.id), t]));
  const registro = registroDeGruposEmMemoria(grupos);
  const registrados = registro.grupos;

  const groupRegistry: IGroupRegistry = {
    ...registro,
    createGroup: async (grupo) => {
      // Lento de proposito: se o servidor nao atender em ordem, o assign
      // seguinte procura o grupo antes de ele existir.
      await new Promise((r) => setTimeout(r, 20));
      await registro.createGroup(grupo);
    },
  };

  const provider: ITaskProvider & { groupRegistry: IGroupRegistry } = {
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
    groupRegistry,
  };

  return { provider, porId, registrados };
}

let servidor: TaskWebSocketServer | undefined;
let cliente: WebSocket | undefined;

afterEach(async () => {
  cliente?.close();
  await servidor?.stop();
  servidor = undefined;
  cliente = undefined;
});

/** Sobe o servidor numa porta livre e conecta um cliente que guarda o que recebe. */
async function conectar(tarefas: Task[], grupos: Group[] = []) {
  const memoria = emMemoria(tarefas, grupos);
  servidor = new TaskWebSocketServer({
    taskManager: new TaskManager(memoria.provider),
    taskProvider: memoria.provider,
    options: { port: 0, host: '127.0.0.1' },
  });
  await servidor.start();

  const recebidas: WSMessage[] = [];
  const ws = new WebSocket(`ws://127.0.0.1:${servidor.getStatus().port}`);
  cliente = ws;
  ws.on('message', (data) => recebidas.push(JSON.parse(String(data)) as WSMessage));
  await new Promise((r) => ws.once('open', r));

  const enviar = (type: string, payload?: unknown) => ws.send(JSON.stringify({ type, payload }));

  /** Espera ate chegar uma mensagem que satisfaca o predicado. */
  const esperar = async (predicado: (m: WSMessage) => boolean): Promise<WSMessage> => {
    for (let i = 0; i < 100; i++) {
      const achada = recebidas.find(predicado);
      if (achada) return achada;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`nenhuma mensagem esperada chegou; chegaram: ${recebidas.map((m) => m.type).join(', ')}`);
  };

  return { ...memoria, enviar, esperar, recebidas };
}

const atualizada = (id: string) => (m: WSMessage) =>
  m.type === 'task:updated' && (m.payload as Task | undefined)?.id === id;

describe('servidor WebSocket — operacoes nomeadas no lugar do update generico', () => {
  it('set-priority grava o numero pelo manager e avisa os clientes', async () => {
    const { enviar, esperar, porId } = await conectar([tarefa('001')]);

    enviar('set-priority', { taskId: '001', priority: 40 });

    expect(((await esperar(atualizada('001'))).payload as Task).order).toBe(40);
    expect(porId.get('001')?.order).toBe(40);
  });

  it('set-priority fora da faixa volta como erro, sem gravar', async () => {
    const { enviar, esperar, porId } = await conectar([tarefa('001', { order: 10 })]);

    enviar('set-priority', { taskId: '001', priority: 0 });

    await esperar((m) => m.type === 'error');
    expect(porId.get('001')?.order).toBe(10);
  });

  it('set-difficulty grava a dificuldade', async () => {
    const { enviar, esperar, porId } = await conectar([tarefa('001')]);

    enviar('set-difficulty', { taskId: '001', difficulty: 4 });

    await esperar(atualizada('001'));
    expect(porId.get('001')?.difficulty).toBe(4);
  });

  it('create-group e assign-to-group, em sequencia, agrupam — o servidor atende na ordem', async () => {
    const { enviar, esperar, porId, registrados } = await conectar([tarefa('001')]);

    enviar('create-group', { id: 'g-novo', name: 'Novo grupo' });
    enviar('assign-to-group', { taskId: '001', groupId: 'g-novo' });

    await esperar(atualizada('001'));
    expect(registrados).toEqual([{ id: 'g-novo', name: 'Novo grupo' }]);
    expect(porId.get('001')?.groupId).toBe('g-novo');
  });

  it('assign-to-group recusa um grupo que nao existe', async () => {
    const { enviar, esperar, porId } = await conectar([tarefa('001')]);

    enviar('assign-to-group', { taskId: '001', groupId: 'g-fantasma' });

    expect(((await esperar((m) => m.type === 'error')).payload as { message: string }).message).toMatch(/g-fantasma/);
    expect(porId.get('001')?.groupId).toBeUndefined();
  });

  it('remove-from-group tira do grupo', async () => {
    const g = 'g-x' as GroupId;
    const { enviar, esperar, porId } = await conectar([tarefa('001', { groupId: g })], [{ id: g, name: 'X' }]);

    enviar('remove-from-group', { taskId: '001' });

    await esperar(atualizada('001'));
    expect(porId.get('001')?.groupId).toBeUndefined();
  });

  it('move-before reordena e devolve a lista inteira, porque a vizinhanca pode ter mudado', async () => {
    const { enviar, esperar, porId, recebidas } = await conectar([
      tarefa('001', { order: 10 }),
      tarefa('002', { order: 20 }),
    ]);
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-before', { taskId: '002', targetId: '001' });

    await esperar((m) => m.type === 'tasks');
    expect(porId.get('002')?.order).toBeLessThan(porId.get('001')?.order ?? 0);
  });

  it('move-after poe depois da referencia', async () => {
    const { enviar, esperar, porId, recebidas } = await conectar([
      tarefa('001', { order: 10 }),
      tarefa('002', { order: 20 }),
    ]);
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-after', { taskId: '001', targetId: '002' });

    await esperar((m) => m.type === 'tasks');
    expect(porId.get('001')?.order).toBeGreaterThan(porId.get('002')?.order ?? 0);
  });

  it('move-to-top leva a tarefa a frente da fila, sem referencia', async () => {
    const { enviar, esperar, porId, recebidas } = await conectar([
      tarefa('001', { order: 10 }),
      tarefa('002', { order: 20 }),
      tarefa('003', { order: 30 }),
    ]);
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-to-top', { taskId: '003' });

    await esperar((m) => m.type === 'tasks');
    expect(porId.get('003')?.order).toBeLessThan(porId.get('001')?.order ?? 0);
  });

  it('move-to-bottom leva a tarefa ao fim, numerando a cauda sem numero', async () => {
    const { enviar, esperar, porId, recebidas } = await conectar([
      tarefa('001', { order: 10 }),
      tarefa('002', { order: 20 }),
      tarefa('003'),
    ]);
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-to-bottom', { taskId: '001' });

    await esperar((m) => m.type === 'tasks');
    expect(porId.get('003')?.order).toBeDefined();
    expect(porId.get('001')?.order).toBeGreaterThan(porId.get('003')?.order ?? Number.POSITIVE_INFINITY);
  });

  it('move-group-to-top e move-group-to-bottom levam o grupo inteiro (task-117)', async () => {
    const g = parseGroupId('g-a');
    const { enviar, esperar, porId, recebidas } = await conectar(
      [
        tarefa('001', { order: 10 }),
        tarefa('002', { order: 20, groupId: g }),
        tarefa('003', { order: 30, groupId: g }),
      ],
      [{ id: g, name: 'A' }],
    );
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-group-to-top', { groupId: 'g-a' });
    await esperar((m) => m.type === 'tasks');
    expect(porId.get('003')?.order).toBeLessThan(porId.get('001')?.order ?? 0);
    expect(porId.get('002')?.order).toBeLessThan(porId.get('003')?.order ?? 0);

    recebidas.length = 0;
    enviar('move-group-to-bottom', { groupId: 'g-a' });
    await esperar((m) => m.type === 'tasks');
    expect(porId.get('002')?.order).toBeGreaterThan(porId.get('001')?.order ?? Number.POSITIVE_INFINITY);
  });

  it('move-group-before e move-group-after aceitam tarefa ou grupo como alvo', async () => {
    const [a, b] = [parseGroupId('g-a'), parseGroupId('g-b')];
    const { enviar, esperar, porId, recebidas } = await conectar(
      [
        tarefa('001', { order: 10, groupId: b }),
        tarefa('002', { order: 20 }),
        tarefa('003', { order: 30, groupId: a }),
      ],
      [
        { id: a, name: 'A' },
        { id: b, name: 'B' },
      ],
    );
    await esperar((m) => m.type === 'tasks');
    recebidas.length = 0;

    enviar('move-group-before', { groupId: 'g-a', targetId: 'g-b' });
    await esperar((m) => m.type === 'tasks');
    expect(porId.get('003')?.order).toBeLessThan(porId.get('001')?.order ?? 0);

    recebidas.length = 0;
    enviar('move-group-after', { groupId: 'g-a', targetId: '002' });
    await esperar((m) => m.type === 'tasks');
    expect(porId.get('003')?.order).toBeGreaterThan(porId.get('002')?.order ?? Number.POSITIVE_INFINITY);
  });

  it('move-group com alvo membro do proprio grupo volta como erro, sem gravar', async () => {
    const g = parseGroupId('g-a');
    const { enviar, esperar, porId } = await conectar(
      [tarefa('001', { order: 10, groupId: g }), tarefa('002', { order: 20, groupId: g })],
      [{ id: g, name: 'A' }],
    );
    await esperar((m) => m.type === 'tasks');

    enviar('move-group-after', { groupId: 'g-a', targetId: '002' });

    const erro = await esperar((m) => m.type === 'error');
    expect(JSON.stringify(erro)).toContain('member');
    expect(porId.get('001')?.order).toBe(10);
  });

  it('o update generico nao existe mais: e recusado, e nada e gravado', async () => {
    const { enviar, esperar, porId } = await conectar([tarefa('001')]);

    enviar('update', { id: '001', order: 5, difficulty: 2 });

    expect(((await esperar((m) => m.type === 'error')).payload as { message: string }).message).toMatch(
      /Unknown message type: update/,
    );
    expect(porId.get('001')).toEqual(tarefa('001'));
  });

  it('payload sem o que a operacao precisa volta como erro claro', async () => {
    const { enviar, esperar } = await conectar([tarefa('001')]);

    enviar('set-priority', { taskId: '001' });

    expect(((await esperar((m) => m.type === 'error')).payload as { message: string }).message).toMatch(/set-priority/);
  });

  /*
   * Grupo dentro de grupo (task-119): o quadro cria o subgrupo e aninha grupo
   * em grupo pelas operacoes do dominio, e todos os clientes ficam sabendo.
   */
  it('create-group com parentId cria ja aninhado, e avisa com o pai', async () => {
    const { enviar, esperar, registrados } = await conectar([], [{ id: parseGroupId('g-pai'), name: 'Pai' }]);

    enviar('create-group', { id: 'g-sub', name: 'Sub', parentId: 'g-pai' });

    const aviso = await esperar((m) => m.type === 'group:created');
    expect(aviso.payload).toEqual({ id: 'g-sub', name: 'Sub', parentId: 'g-pai' });
    expect(registrados.find((g) => g.id === 'g-sub')?.parentId).toBe('g-pai');
  });

  it('nest-group e unnest-group mudam o pai e avisam com o grupo', async () => {
    const { enviar, esperar, recebidas, registrados } = await conectar(
      [],
      [
        { id: parseGroupId('g-pai'), name: 'Pai' },
        { id: parseGroupId('g-sub'), name: 'Sub' },
      ],
    );

    enviar('nest-group', { groupId: 'g-sub', parentId: 'g-pai' });
    expect((await esperar((m) => m.type === 'group:updated')).payload).toEqual({
      id: 'g-sub',
      name: 'Sub',
      parentId: 'g-pai',
    });
    expect(registrados.find((g) => g.id === 'g-sub')?.parentId).toBe('g-pai');

    recebidas.length = 0;
    enviar('unnest-group', { groupId: 'g-sub' });
    expect((await esperar((m) => m.type === 'group:updated')).payload).toEqual({ id: 'g-sub', name: 'Sub' });
  });

  it('nest-group recusa o ciclo, sem gravar', async () => {
    const { enviar, esperar, registrados } = await conectar(
      [],
      [
        { id: parseGroupId('g-pai'), name: 'Pai' },
        { id: parseGroupId('g-sub'), name: 'Sub', parentId: parseGroupId('g-pai') },
      ],
    );

    enviar('nest-group', { groupId: 'g-pai', parentId: 'g-sub' });

    expect(((await esperar((m) => m.type === 'error')).payload as { message: string }).message).toMatch(/cycle/);
    expect(registrados.find((g) => g.id === 'g-pai')?.parentId).toBeUndefined();
  });
});
