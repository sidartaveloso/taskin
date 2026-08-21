import { mount } from '@vue/test-utils';
import { h, type SetupContext } from 'vue';
import { describe, expect, it } from 'vitest';
import Dashboard from './Dashboard.vue';

const SlotLayoutStub = {
  setup: (_: unknown, { slots }: SetupContext) => () =>
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
      props: { tasks: [{ id: '1', number: 1, title: 'T1', status: 'pending', type: 'feat', dates: { created: '2026-01-01' } }] },
      global: { stubs: { DashboardLayout: SlotLayoutStub, TaskGrid: true } },
    });
    expect(wrapper.find('.loading-state').exists()).toBe(false);
    expect(wrapper.find('.empty-state').exists()).toBe(false);
  });

  it('forwards the retry event from the layout', async () => {
    const RetryLayoutStub = {
      emits: ['retry'],
      setup: (_: unknown, { emit }: SetupContext) => () =>
        h('button', { class: 'retry-btn', onClick: () => emit('retry') }, 'retry'),
    };
    const wrapper = mount(Dashboard, {
      props: { showRetry: true },
      global: { stubs: { DashboardLayout: RetryLayoutStub, TaskGrid: true } },
    });
    await wrapper.find('.retry-btn').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
