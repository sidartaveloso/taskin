import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));
vi.mock(
  '../../composables/use-prioritization',
  () => import('../../composables/use-prioritization/use-prioritization.mock'),
);

import {
  createPrioritizationMock,
  usePrioritization,
} from '../../composables/use-prioritization/use-prioritization.mock';
import type { Task } from '../../types';
import { taskId } from '../../types';
import PrioritizationPage from './PrioritizationPage.vue';

const ScreenStub = {
  name: 'PrioritizationScreen',
  props: [
    'tree',
    'filter',
    'viewMode',
    'sortMode',
    'dragEnabled',
    'canUndo',
    'canRedo',
    'focusedId',
    'detecting',
    'cameraActive',
    'gestureFunctions',
    'gestureUserId',
  ],
  emits: [
    'toggle-tracking',
    'gesture-action',
    'update:camera-active',
    'update:filter',
    'update:view-mode',
    'update:sort-mode',
    'toggle-collapse',
    'set-all-collapsed',
    'set-difficulty',
    'rename-group',
    'move-before',
    'move-after',
    'group-with',
    'join-group',
    'move-group-before',
    'move-group-after',
    'group-with-group',
    'move-up',
    'move-down',
    'ungroup',
    'export-json',
    'copy-card',
    'copy-group',
    'update:focused-id',
    'undo',
    'redo',
  ],
  setup: () => () => h('div', { class: 'screen-stub' }),
};

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

describe('PrioritizationPage', () => {
  let api: ReturnType<typeof createPrioritizationMock>;

  beforeEach(() => {
    api = createPrioritizationMock();
    vi.mocked(usePrioritization).mockReturnValue(api);
  });

  function mountPage() {
    return mount(PrioritizationPage, {
      props: { tasks: [makeTask('1'), makeTask('2')] },
      global: { stubs: { PrioritizationScreen: ScreenStub } },
    });
  }

  it('renders the prioritization screen', () => {
    const wrapper = mountPage();
    expect(wrapper.find('.screen-stub').exists()).toBe(true);
  });

  it('forwards the tasks into the composable', () => {
    mountPage();
    expect(usePrioritization).toHaveBeenCalled();
  });

  it('forwards screen commands to the composable', async () => {
    const wrapper = mountPage();
    const screen = wrapper.findComponent(ScreenStub);
    screen.vm.$emit('undo');
    screen.vm.$emit('set-difficulty', '1', 3);
    screen.vm.$emit('move-up', '2');
    await nextTick();
    expect(api.undo).toHaveBeenCalled();
    expect(api.setDifficulty).toHaveBeenCalledWith('1', 3);
    expect(api.moveUp).toHaveBeenCalledWith('2');
  });

  it('emits update-task and update-tasks when tasks change', async () => {
    const wrapper = mountPage();
    const changed = makeTask('1');
    api.changedTasks.value = [changed];
    await nextTick();
    expect(wrapper.emitted('update-task')).toEqual([[changed]]);
    expect(wrapper.emitted('update-tasks')).toEqual([[[changed]]]);
  });

  it('triggers undo on ctrl+z', async () => {
    mountPage();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    await nextTick();
    expect(api.undo).toHaveBeenCalled();
  });

  it('triggers redo on ctrl+shift+z', async () => {
    mountPage();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
    await nextTick();
    expect(api.redo).toHaveBeenCalled();
  });
});
