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
          emits: ['update-task', 'update-group', 'move'],
          template: '<div data-testid="prioritization"><div data-testid="tasks-count">{{ tasks.length }}</div></div>',
          props: ['tasks', 'groups'],
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

  it('should show only open tasks when no filter is set', async () => {
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
    expect(tasksCount.text()).toBe('1');
    expect(wrapper.find('.filter-toggle button.active').attributes('data-filter')).toBe('open');
  });

  it('should show every task when filter=all', async () => {
    window.history.replaceState({}, '', '/?filter=all');

    const wrapper = await mountApp();

    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', status: 'done', title: 'Done task' }),
      createMockTask({ id: '2', status: 'pending', title: 'Pending task' }),
    ];

    await nextTick();

    expect(wrapper.find('[data-testid="tasks-count"]').text()).toBe('2');
  });

  it('a visible control switches to all, and says how many of the total are shown', async () => {
    window.history.replaceState({}, '', '/');

    const wrapper = await mountApp();

    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', status: 'done', title: 'Done task' }),
      createMockTask({ id: '2', status: 'pending', title: 'Pending task' }),
      createMockTask({ id: '3', status: 'canceled', title: 'Canceled task' }),
    ];

    await nextTick();
    expect(wrapper.find('[data-testid="filter-count"]').text()).toBe('Showing 1 of 3 tasks');

    await wrapper.find('.filter-toggle button[data-filter="all"]').trigger('click');

    expect(wrapper.find('[data-testid="tasks-count"]').text()).toBe('3');
    expect(wrapper.find('[data-testid="filter-count"]').text()).toBe('Showing 3 of 3 tasks');
    expect(new URLSearchParams(window.location.search).get('filter')).toBe('all');
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

  it('um movimento do quadro vai ao dominio como move-before, sem set-priority calculado', async () => {
    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [createMockTask({ id: '001', order: 10 }), createMockTask({ id: '002', order: 20 })];
    const operar = vi.spyOn(store, 'operar').mockImplementation(() => {});

    await wrapper.findAll('.mode-toggle button')[1]?.trigger('click');
    const pagina = wrapper.findComponent({ name: 'PrioritizationPage' });
    pagina.vm.$emit('move', { kind: 'task', id: '002', lado: 'before', targetId: '001' });
    pagina.vm.$emit('move', { kind: 'group', id: 'g-a', lado: 'after', targetId: '002' });

    expect(operar.mock.calls.map(([op]) => op)).toEqual([
      { type: 'move-before', payload: { taskId: '002', targetId: '001' } },
      { type: 'move-group-after', payload: { groupId: 'g-a', targetId: '002' } },
    ]);
  });

  /*
   * Grupo dentro de grupo (task-119): o subgrupo que o quadro cria vai ao
   * dominio ja com o pai, antes de as tarefas entrarem nele — e o App passa a
   * saber do pai, para a arvore que volta com a lista continuar aninhada.
   */
  it('um subgrupo novo vira create-group com o pai, e os membros nao o criam de novo', async () => {
    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [createMockTask({ id: '001', groupId: 'g-pai' }), createMockTask({ id: '002', groupId: 'g-pai' })];
    const operar = vi.spyOn(store, 'operar').mockImplementation(() => {});

    await wrapper.findAll('.mode-toggle button')[1]?.trigger('click');
    const pagina = wrapper.findComponent({ name: 'PrioritizationPage' });
    pagina.vm.$emit('update-group', { id: 'g-sub', name: null, parentId: 'g-pai', novo: true });
    pagina.vm.$emit('update-task', { id: '001', parent: { type: 'group', id: 'g-sub' } });
    pagina.vm.$emit('update-task', { id: '002', parent: { type: 'group', id: 'g-sub' } });
    await nextTick();

    expect(operar.mock.calls.map(([op]) => op)).toEqual([
      { type: 'create-group', payload: { id: 'g-sub', name: 'Novo grupo', parentId: 'g-pai' } },
      { type: 'assign-to-group', payload: { taskId: '001', groupId: 'g-sub' } },
      { type: 'assign-to-group', payload: { taskId: '002', groupId: 'g-sub' } },
    ]);
    expect(pagina.props('groups')).toContainEqual({ id: 'g-sub', name: 'Novo grupo', parentId: 'g-pai' });
  });

  it('aninhar e desaninhar um grupo que existe vira nest-group e unnest-group', async () => {
    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    const operar = vi.spyOn(store, 'operar').mockImplementation(() => {});

    await wrapper.findAll('.mode-toggle button')[1]?.trigger('click');
    const pagina = wrapper.findComponent({ name: 'PrioritizationPage' });
    pagina.vm.$emit('update-group', { id: 'g-a', name: 'A', parentId: 'g-pai', novo: false });
    pagina.vm.$emit('update-group', { id: 'g-a', name: 'A', novo: false });

    expect(operar.mock.calls.map(([op]) => op)).toEqual([
      { type: 'nest-group', payload: { groupId: 'g-a', parentId: 'g-pai' } },
      { type: 'unnest-group', payload: { groupId: 'g-a' } },
    ]);
  });
});

describe('App — o console fica limpo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  /*
   * Cada operacao do quadro devolve a lista inteira, e o mapeamento das tarefas
   * imprimia uma linha por tarefa: com 500 tarefas, 500 linhas por clique, e
   * qualquer erro de verdade se perdia no meio.
   */
  it('mapear as tarefas que chegam nao imprime nada no console', async () => {
    window.history.replaceState({}, '', '/');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const wrapper = await mountApp();
    const { usePiniaTaskProvider } = await import('@opentask/taskin-task-provider-pinia');
    const store = usePiniaTaskProvider();
    store.tasks = [
      createMockTask({ id: '1', title: 'Primeira' }),
      createMockTask({ id: '2', title: 'Segunda', assignee: { id: 'ana', name: 'Ana' } }),
    ];
    await nextTick();

    expect(wrapper.find('[data-testid="tasks-count"]').text()).toBe('2');
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('App — a tela escolhida fica na URL, e o topo numa linha so', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sem `?view=`, abre o Board', async () => {
    window.history.replaceState({}, '', '/');
    const wrapper = await mountApp();

    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(false);
    expect(wrapper.find('.mode-toggle button.active').attributes('data-view')).toBe('board');
  });

  it('`?view=prioritization` abre direto a priorizacao', async () => {
    window.history.replaceState({}, '', '/?view=prioritization');
    const wrapper = await mountApp();

    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(true);
    expect(wrapper.find('.mode-toggle button.active').attributes('data-view')).toBe('prioritization');
  });

  it('um valor desconhecido em `?view=` cai no Board', async () => {
    window.history.replaceState({}, '', '/?view=xyz');
    const wrapper = await mountApp();

    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(false);
  });

  it('trocar de tela grava `?view=`, sem perder o `?filter=`', async () => {
    window.history.replaceState({}, '', '/?filter=closed');
    const wrapper = await mountApp();

    await wrapper.find('.mode-toggle button[data-view="prioritization"]').trigger('click');

    const params = new URLSearchParams(window.location.search);
    expect(params.get('view')).toBe('prioritization');
    expect(params.get('filter')).toBe('closed');
    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(true);
  });

  it('trocar o filtro nao perde a tela escolhida', async () => {
    window.history.replaceState({}, '', '/?view=prioritization');
    const wrapper = await mountApp();

    await wrapper.find('.filter-toggle button[data-filter="all"]').trigger('click');

    const params = new URLSearchParams(window.location.search);
    expect(params.get('view')).toBe('prioritization');
    expect(params.get('filter')).toBe('all');
  });

  it('as telas, o filtro e a contagem ficam na mesma barra', async () => {
    window.history.replaceState({}, '', '/');
    const wrapper = await mountApp();

    const barra = wrapper.find('[data-testid="top-bar"]');
    expect(barra.exists()).toBe(true);
    expect(barra.find('.mode-toggle').exists()).toBe(true);
    expect(barra.find('.filter-toggle').exists()).toBe(true);
    expect(barra.find('[data-testid="filter-count"]').exists()).toBe(true);
  });
});
