import type { Task } from '@opentask/taskin-types';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePiniaTaskProvider } from './pinia-task-provider.js';

/** Um WebSocket de mentira que so guarda o que foi enviado. */
class WebSocketFalso {
  static readonly OPEN = 1;
  static ultimo: WebSocketFalso | undefined;
  readyState = WebSocketFalso.OPEN;
  enviadas: { type: string; payload?: unknown }[] = [];
  onopen?: () => void;
  onmessage?: (e: MessageEvent) => void;
  onclose?: () => void;
  onerror?: (e: Event) => void;

  constructor() {
    WebSocketFalso.ultimo = this;
  }

  send(dados: string) {
    this.enviadas.push(JSON.parse(dados));
  }

  close() {}
}

const tarefa = { id: '001', title: 'Um', status: 'pending', type: 'feat', createdAt: '' } as unknown as Task;

function conectado() {
  const store = usePiniaTaskProvider();
  store.connect({ wsUrl: 'ws://falso', autoReconnect: false });
  const ws = WebSocketFalso.ultimo as WebSocketFalso;
  ws.onopen?.();
  ws.enviadas.length = 0;
  store.tasks = [{ ...tarefa }];
  return { store, ws };
}

describe('store do dashboard — operacoes nomeadas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('WebSocket', WebSocketFalso);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('manda a operacao pelo nome, e nao a tarefa inteira', () => {
    const { store, ws } = conectado();

    store.operar({ type: 'set-priority', payload: { taskId: '001', priority: 40 } });

    expect(ws.enviadas).toEqual([
      expect.objectContaining({ type: 'set-priority', payload: { taskId: '001', priority: 40 } }),
    ]);
  });

  it('aplica no cache antes da resposta, para o quadro nao piscar', () => {
    const { store } = conectado();

    store.operar({ type: 'set-difficulty', payload: { taskId: '001', difficulty: 3 } });
    store.operar({ type: 'assign-to-group', payload: { taskId: '001', groupId: 'g-1' } });
    expect(store.tasks[0]).toMatchObject({ difficulty: 3, groupId: 'g-1' });

    store.operar({ type: 'remove-from-group', payload: { taskId: '001' } });
    expect(store.tasks[0]?.groupId).toBeUndefined();
  });

  it('recusa sem conexao', () => {
    const { store, ws } = conectado();
    store.connected = false;

    expect(() => store.operar({ type: 'set-priority', payload: { taskId: '001', priority: 1 } })).toThrow(
      /Not connected/,
    );
    expect(ws.enviadas).toEqual([]);
  });

  it('updateTask generico nao grava mais: o servidor so aceita operacoes nomeadas', async () => {
    const { store, ws } = conectado();

    await expect(store.updateTask({ ...tarefa, order: 5 })).rejects.toThrow(/named operations/);
    expect(ws.enviadas).toEqual([]);
  });
});
