import type { PiniaTaskStore } from '@opentask/taskin-task-provider-pinia';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import App from './App.vue';

type StoreTask = PiniaTaskStore['tasks'][number];

function createMockTask(overrides: Record<string, unknown> = {}): StoreTask {
  return {
    id: 'task-001',
    title: 'Test task',
    status: 'pending',
    type: 'feat',
    createdAt: '2025-01-01T00:00:00.000Z',
    content: '# task',
    filePath: '/tasks/task-001.md',
    ...overrides,
  } as unknown as StoreTask;
}

async function mountApp() {
  const wrapper = mount(App, {
    global: {
      stubs: {
        Dashboard: {
          template: '<div><slot /><div data-testid="tasks-count">{{ tasks.length }}</div></div>',
          props: [
            'tasks',
            'title',
            'connectionStatus',
            'statusText',
            'errorMessage',
            'showRetry',
            'isRetrying',
            'isLoading',
          ],
        },
        PrioritizationPage: {
          name: 'PrioritizationPage',
          emits: ['update-task'],
          template: '<div data-testid="prioritization"><div data-testid="tasks-count">{{ tasks.length }}</div></div>',
          props: ['tasks'],
        },
      },
    },
  });
  return wrapper;
}

describe('App --open/--closed filter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should show all tasks when no filter is set', async () => {
    window.history.replaceState({}, '', '/');

    const wrapper = await mountApp();

    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', status: 'done', title: 'Done task' }),
      createMockTask({ id: '2', status: 'pending', title: 'Pending task' }),
    ];

    await nextTick();

    const tasksCount = wrapper.find('[data-testid="tasks-count"]');
    expect(tasksCount.text()).toBe('2');
  });

  it('should show only open tasks when filter=open', async () => {
    window.history.replaceState({}, '', '/?filter=open');

    const wrapper = await mountApp();

    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', status: 'done', title: 'Done task' }),
      createMockTask({
        id: '2',
        status: 'pending',
        title: 'Pending task',
      }),
      createMockTask({
        id: '3',
        status: 'in-progress',
        title: 'In progress task',
      }),
      createMockTask({ id: '4', status: 'blocked', title: 'Blocked task' }),
      createMockTask({
        id: '5',
        status: 'canceled',
        title: 'Canceled task',
      }),
    ];

    await nextTick();

    const tasksCount = wrapper.find('[data-testid="tasks-count"]');
    expect(tasksCount.text()).toBe('3');
  });

  it('should show only closed tasks when filter=closed', async () => {
    window.history.replaceState({}, '', '/?filter=closed');

    const wrapper = await mountApp();

    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', status: 'done', title: 'Done task' }),
      createMockTask({
        id: '2',
        status: 'pending',
        title: 'Pending task',
      }),
      createMockTask({
        id: '3',
        status: 'canceled',
        title: 'Canceled task',
      }),
    ];

    await nextTick();

    const tasksCount = wrapper.find('[data-testid="tasks-count"]');
    expect(tasksCount.text()).toBe('2');
  });
});

/*
 * O quadro nao manda mais a tarefa inteira num `update` generico: o que ele
 * mudou vai como operacao nomeada, a mesma do `ITaskManager` (task-106).
 */
describe('App — o quadro de priorizacao grava por operacoes nomeadas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.history.replaceState({}, '', '/');
  });

  it('uma mudanca de prioridade e de dificuldade vira set-priority e set-difficulty', async () => {
    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [createMockTask({ id: '001', order: 10, difficulty: 2 })];
    const operar = vi.spyOn(store, 'operar').mockImplementation(() => {});
    const updateTask = vi.spyOn(store, 'updateTask');

    await wrapper.findAll('.mode-toggle button')[1]?.trigger('click');
    wrapper
      .findComponent({ name: 'PrioritizationPage' })
      .vm.$emit('update-task', { id: '001', order: 5, difficulty: 4, parent: undefined });

    expect(operar.mock.calls.map(([op]) => op)).toEqual([
      { type: 'set-priority', payload: { taskId: '001', priority: 5 } },
      { type: 'set-difficulty', payload: { taskId: '001', difficulty: 4 } },
    ]);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('dois membros de um grupo novo criam o grupo uma vez so', async () => {
    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [createMockTask({ id: '001' }), createMockTask({ id: '002' })];
    const operar = vi.spyOn(store, 'operar').mockImplementation(() => {});

    await wrapper.findAll('.mode-toggle button')[1]?.trigger('click');
    const pagina = wrapper.findComponent({ name: 'PrioritizationPage' });
    const novo = { type: 'group', id: 'g-novo' };
    pagina.vm.$emit('update-task', { id: '001', parent: novo });
    pagina.vm.$emit('update-task', { id: '002', parent: novo });

    expect(operar.mock.calls.map(([op]) => op.type)).toEqual(['create-group', 'assign-to-group', 'assign-to-group']);
  });
});
