import type { PiniaTaskStore } from '@opentask/taskin-task-provider-pinia';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
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
