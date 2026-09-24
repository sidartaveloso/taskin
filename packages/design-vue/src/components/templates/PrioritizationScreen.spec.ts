import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { PriorityNode } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import { groupId, taskId } from '../../types';
import PrioritizationScreen from './PrioritizationScreen.vue';

function makeTask(id: string): Task {
  return {
    id: taskId(id),
    number: Number(id),
    title: `Task ${id}`,
    status: 'pending',
    type: 'feat',
    dates: { created: '2026-01-01' },
  };
}

const tree: PriorityNode[] = [
  { kind: 'task', task: makeTask('1') },
  {
    kind: 'group',
    groupId: groupId('g-a'),
    groupName: 'A',
    collapsed: false,
    items: [
      { kind: 'task', task: makeTask('2') },
      { kind: 'task', task: makeTask('3') },
    ],
  },
];

describe('PrioritizationScreen — topo e fim num clique', () => {
  it('cada cartao tem os dois botoes, com rotulo acessivel, e eles emitem o id da tarefa', async () => {
    const wrapper = mount(PrioritizationScreen, { props: { tree } });

    const top = wrapper.get('[data-testid="move-to-top-3"]');
    const bottom = wrapper.get('[data-testid="move-to-bottom-1"]');
    expect(top.attributes('aria-label')).toBe('Move to top');
    expect(bottom.attributes('aria-label')).toBe('Move to bottom');

    await top.trigger('click');
    await bottom.trigger('click');

    expect(wrapper.emitted('move-to-top')).toEqual([['3']]);
    expect(wrapper.emitted('move-to-bottom')).toEqual([['1']]);
  });

  it('o grupo tem os proprios botoes, que emitem o id do grupo', async () => {
    const wrapper = mount(PrioritizationScreen, { props: { tree } });

    await wrapper.get('[data-testid="move-group-to-top-g-a"]').trigger('click');
    await wrapper.get('[data-testid="move-group-to-bottom-g-a"]').trigger('click');

    expect(wrapper.emitted('move-group-to-top')).toEqual([['g-a']]);
    expect(wrapper.emitted('move-group-to-bottom')).toEqual([['g-a']]);
  });

  it('fora do modo manual os botoes nao aparecem', () => {
    const wrapper = mount(PrioritizationScreen, { props: { tree, sortMode: 'diff-asc', dragEnabled: false } });

    expect(wrapper.find('[data-testid="move-to-top-1"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="move-group-to-top-g-a"]').exists()).toBe(false);
  });
});
