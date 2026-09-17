import { parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it, vi } from 'vitest';
import { TaskManager } from './task-manager.js';
import type { ITaskProvider } from './task-manager.types.js';

const tarefa = (extra: Partial<Task> = {}): Task =>
  ({ id: parseTaskId('001'), title: 'Uma tarefa', status: 'in-progress', type: 'feat', ...extra }) as Task;

function provider(overrides: Partial<ITaskProvider> = {}): ITaskProvider {
  return {
    initialize: vi.fn(async () => {}),
    findTask: vi.fn(async () => tarefa()),
    getAllTasks: vi.fn(async () => [tarefa()]),
    updateTask: vi.fn(async () => {}),
    createTask: vi.fn(),
    lint: vi.fn(),
    ...overrides,
  } as unknown as ITaskProvider;
}

/**
 * O aviso no `finish`, e por que ele **avisa** em vez de recusar.
 *
 * Fechar uma tarefa e um gesto que acontece uma vez, muitas vezes com pressa.
 * Recusar ali torna o comando fragil e ensina a contornar. O portao duro vive no
 * `lint` (task-075), que roda em CI e quebra o build; aqui o papel e outro —
 * dizer, no momento em que a pessoa ainda esta olhando, o que ficou para tras.
 *
 * E uma **capacidade opcional** do provider: nem toda fonte tem checklist. Um
 * provider sem ela conclui sem portao nenhum, em vez de receber uma chamada que
 * falha.
 */
describe('finishTask e os criterios em aberto', () => {
  it('conclui em silencio quando o provider nao tem a capacidade', async () => {
    const manager = new TaskManager(provider());

    const { blockers } = await manager.finishTaskComRelato(parseTaskId('001'));

    expect(blockers).toEqual([]);
  });

  it('relata os itens em aberto que o provider aponta', async () => {
    const manager = new TaskManager(
      provider({
        getCompletionBlockers: vi.fn(async () => [{ texto: 'Documentar', linha: 12 }]),
      } as Partial<ITaskProvider>),
    );

    const { blockers } = await manager.finishTaskComRelato(parseTaskId('001'));

    expect(blockers).toHaveLength(1);
    expect(blockers[0]?.texto).toBe('Documentar');
  });

  it('conclui mesmo assim: avisa, e nao recusa', async () => {
    const updateTask = vi.fn(async () => {});
    const manager = new TaskManager(
      provider({
        updateTask,
        getCompletionBlockers: vi.fn(async () => [{ texto: 'Documentar', linha: 12 }]),
      } as Partial<ITaskProvider>),
    );

    const { task } = await manager.finishTaskComRelato(parseTaskId('001'));

    expect(task.status).toBe('done');
    expect(updateTask).toHaveBeenCalled();
  });

  it('nao relata nada quando tudo esta feito ou adiado', async () => {
    const manager = new TaskManager(
      provider({ getCompletionBlockers: vi.fn(async () => []) } as Partial<ITaskProvider>),
    );

    expect((await manager.finishTaskComRelato(parseTaskId('001'))).blockers).toEqual([]);
  });
});
