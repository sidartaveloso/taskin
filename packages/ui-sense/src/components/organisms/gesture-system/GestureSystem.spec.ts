import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock(
  '../../../composables/use-gesture-recognizer',
  () => import('../../../composables/use-gesture-recognizer/use-gesture-recognizer.mock'),
);
vi.mock(
  '../../../composables/use-gesture-shortcuts',
  () => import('../../../composables/use-gesture-shortcuts/use-gesture-shortcuts.mock'),
);

import {
  createGestureRecognizerMock,
  useGestureRecognizer,
} from '../../../composables/use-gesture-recognizer/use-gesture-recognizer.mock';
import {
  createGestureShortcutsMock,
  useGestureShortcuts,
} from '../../../composables/use-gesture-shortcuts/use-gesture-shortcuts.mock';
import { defaultFunctions } from './GestureSystem.types';
import GestureSystem from './GestureSystem.vue';

function mountSystem(props: Partial<{ detecting: boolean; videoElement: HTMLVideoElement | null }> = {}) {
  const recognizer = createGestureRecognizerMock();
  vi.mocked(useGestureRecognizer).mockReturnValue(recognizer);
  vi.mocked(useGestureShortcuts).mockReturnValue(createGestureShortcutsMock());
  const wrapper = mount(GestureSystem, {
    props: {
      functions: defaultFunctions,
      userId: 'u1',
      detecting: false,
      ...props,
    } as never,
  });
  return { wrapper, recognizer };
}

describe('GestureSystem', () => {
  it('renders an internal video element when no external video is provided', () => {
    const { wrapper } = mountSystem();
    expect(wrapper.find('video').exists()).toBe(true);
  });

  it('renders the legend while detection is active', async () => {
    const { wrapper, recognizer } = mountSystem();
    recognizer.state.value.isDetecting = true;
    await nextTick();
    expect(wrapper.find('.gesture-system__legend').exists()).toBe(true);
  });

  it('emits camera-active when detection state changes', async () => {
    const { wrapper, recognizer } = mountSystem();
    recognizer.state.value.isDetecting = true;
    await nextTick();
    expect(wrapper.emitted('camera-active')).toBeTruthy();
  });
});
