import { parseTaskId } from '@opentask/taskin-types';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import TaskinWorkspace from './TaskinWorkspace.vue';

const tarefa = (id: string): Task => ({
  id: parseTaskId(id),
  number: Number(id),
  title: `Task ${id}`,
  status: 'pending',
  type: 'feat',
  dates: { created: new Date('2026-09-24') },
});

const DashboardStub = {
  name: 'Dashboard',
  props: ['tasks', 'title', 'isLoading', 'showConnection', 'gridTitle'],
  emits: ['retry'],
  template: '<div data-testid="board">{{ tasks.length }}</div>',
};

const PrioritizationPageStub = {
  name: 'PrioritizationPage',
  props: ['tasks', 'groups', 'sortMode'],
  emits: ['update-task', 'update-group', 'move'],
  template: '<div data-testid="prioritization">{{ tasks.length }}</div>',
};

function montar(props: Partial<InstanceType<typeof TaskinWorkspace>['$props']> = {}) {
  return mount(TaskinWorkspace, {
    props: { tasks: [tarefa('1'), tarefa('2')], total: 5, ...props },
    global: { stubs: { Dashboard: DashboardStub, PrioritizationPage: PrioritizationPageStub } },
  });
}

describe('TaskinWorkspace', () => {
  it('shows the Board by default, with the connection off its header', () => {
    const wrapper = montar();

    expect(wrapper.find('[data-testid="board"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'Dashboard' }).props('showConnection')).toBe(false);
    expect(wrapper.find('.mode-toggle button.active').attributes('data-view')).toBe('board');
  });

  it('shows the prioritization screen when the view says so, with the sort it was given', () => {
    const wrapper = montar({ view: 'prioritization', sort: 'diff-asc' });

    expect(wrapper.find('[data-testid="prioritization"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="board"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'PrioritizationPage' }).props('sortMode')).toBe('diff-asc');
  });

  it('emits the screen chosen, and does not switch on its own', async () => {
    const wrapper = montar();

    await wrapper.find('.mode-toggle button[data-view="prioritization"]').trigger('click');

    expect(wrapper.emitted('update:view')).toEqual([['prioritization']]);
    expect(wrapper.find('[data-testid="board"]').exists()).toBe(true);
  });

  it('lights the filter it was given and emits the one chosen', async () => {
    const wrapper = montar({ filter: 'open' });

    expect(wrapper.find('.filter-toggle button.active').attributes('data-filter')).toBe('open');
    await wrapper.find('.filter-toggle button[data-filter="closed"]').trigger('click');

    expect(wrapper.emitted('update:filter')).toEqual([['closed']]);
  });

  it('titles the Board by the filter', () => {
    expect(montar({ filter: 'closed' }).findComponent({ name: 'Dashboard' }).props('gridTitle')).toBe('Closed tasks');
    expect(montar().findComponent({ name: 'Dashboard' }).props('gridTitle')).toBe('All tasks');
  });

  it('shows the search, order and score it was given, and emits each change', async () => {
    const wrapper = montar({ search: 'crash', sort: 'diff-desc', score: 'unscored' });

    expect((wrapper.find('[data-testid="search-input"]').element as HTMLInputElement).value).toBe('crash');
    expect((wrapper.find('[data-testid="sort-select"]').element as HTMLSelectElement).value).toBe('diff-desc');
    expect((wrapper.find('[data-testid="score-select"]').element as HTMLSelectElement).value).toBe('unscored');

    await wrapper.find('[data-testid="search-input"]').setValue('guia');
    await wrapper.find('[data-testid="sort-select"]').setValue('diff-asc');
    await wrapper.find('[data-testid="score-select"]').setValue('scored');

    expect(wrapper.emitted('update:search')).toEqual([['guia']]);
    expect(wrapper.emitted('update:sort')).toEqual([['diff-asc']]);
    expect(wrapper.emitted('update:score')).toEqual([['scored']]);
  });

  it('counts what it shows against the total', () => {
    expect(montar().find('[data-testid="filter-count"]').text()).toBe('Showing 2 of 5 tasks');
  });

  it('shows the connection in the top bar, and the error with a retry when it drops', async () => {
    const conectado = montar({ connectionStatus: 'connected', statusText: 'Connected' });
    expect(conectado.find('[data-testid="top-bar"] .connection-status').exists()).toBe(true);
    expect(conectado.find('[data-testid="connection-error"]').exists()).toBe(false);

    const caido = montar({ connectionStatus: 'error', connectionError: 'O servidor nao responde' });
    expect(caido.find('[data-testid="connection-error"]').text()).toContain('O servidor nao responde');
    await caido.find('[data-testid="top-bar"] .connection-status button').trigger('click');
    expect(caido.emitted('retry')).toHaveLength(1);
  });

  it('passes the prioritization events through', () => {
    const wrapper = montar({ view: 'prioritization' });
    const pagina = wrapper.findComponent({ name: 'PrioritizationPage' });
    const task = tarefa('1');

    pagina.vm.$emit('update-task', task);
    pagina.vm.$emit('update-group', { id: 'g1' });
    pagina.vm.$emit('move', { kind: 'task' });

    expect(wrapper.emitted('update-task')).toEqual([[task]]);
    expect(wrapper.emitted('update-group')).toEqual([[{ id: 'g1' }]]);
    expect(wrapper.emitted('move')).toEqual([[{ kind: 'task' }]]);
  });
});
