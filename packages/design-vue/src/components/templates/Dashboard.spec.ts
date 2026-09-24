import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, type SetupContext } from 'vue';
import { taskId } from '../../types';
import Dashboard from './Dashboard.vue';

const SlotLayoutStub = {
  setup:
    (_: unknown, { slots }: SetupContext) =>
    () =>
      h('div', { class: 'layout-stub' }, slots.default?.()),
};

describe('Dashboard', () => {
  it('shows the loading state when isLoading with no tasks', () => {
    const wrapper = mount(Dashboard, {
      props: { isLoading: true, tasks: [] },
      global: { stubs: { DashboardLayout: SlotLayoutStub, TaskGrid: true } },
    });
    expect(wrapper.find('.loading-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('Carregando tarefas...');
  });

  it('shows the empty state when not loading and no tasks', () => {
    const wrapper = mount(Dashboard, {
      props: { tasks: [] },
      global: { stubs: { DashboardLayout: SlotLayoutStub, TaskGrid: true } },
    });
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('Nenhuma tarefa encontrada');
  });

  it('renders the task grid when tasks are provided', () => {
    const wrapper = mount(Dashboard, {
      props: {
        tasks: [
          {
            id: taskId('1'),
            number: 1,
            title: 'T1',
            status: 'pending',
            type: 'feat',
            dates: { created: '2026-01-01' },
          },
        ],
      },
      global: { stubs: { DashboardLayout: SlotLayoutStub, TaskGrid: true } },
    });
    expect(wrapper.find('.loading-state').exists()).toBe(false);
    expect(wrapper.find('.empty-state').exists()).toBe(false);
  });

  it('forwards the retry event from the layout', async () => {
    const RetryLayoutStub = {
      emits: ['retry'],
      setup:
        (_: unknown, { emit }: SetupContext) =>
        () =>
          h('button', { class: 'retry-btn', onClick: () => emit('retry') }, 'retry'),
    };
    const wrapper = mount(Dashboard, {
      props: { showRetry: true },
      global: { stubs: { DashboardLayout: RetryLayoutStub, TaskGrid: true } },
    });
    await wrapper.find('.retry-btn').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  /*
   * Com o filtro em Closed, o quadro mostrava tarefas concluidas sob
   * "Tarefas em Andamento" (task-129). O titulo vem de quem recortou.
   */
  it('o titulo da lista e o que quem recortou diz, e nao um fixo', () => {
    const tarefa = {
      id: taskId('1'),
      number: 1,
      title: 'T1',
      status: 'done' as const,
      type: 'feat' as const,
      dates: { created: '2026-01-01' },
    };
    const wrapper = mount(Dashboard, {
      props: { tasks: [tarefa], gridTitle: 'Closed tasks' },
      global: { stubs: { DashboardLayout: SlotLayoutStub } },
    });

    expect(wrapper.find('.task-grid-title').text()).toBe('Closed tasks');
    expect(wrapper.text()).not.toContain('Tarefas em Andamento');
  });
});
