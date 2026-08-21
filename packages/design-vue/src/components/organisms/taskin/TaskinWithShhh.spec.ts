import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import { createFaceLandmarkerMock, useFaceLandmarker } from '@opentask/ui-sense/mocks';
import TaskinWithShhh from './TaskinWithShhh.vue';

describe('TaskinWithShhh', () => {
  let face: ReturnType<typeof createFaceLandmarkerMock>;

  beforeEach(() => {
    face = createFaceLandmarkerMock();
    vi.mocked(useFaceLandmarker).mockReturnValue(face);
  });

  it('renders the webcam hidden by default and visible when showWebcam is true', () => {
    const hidden = mount(TaskinWithShhh, { props: { showWebcam: false } });
    expect(hidden.find('video.webcam-video').classes()).not.toContain('visible');

    const shown = mount(TaskinWithShhh, { props: { showWebcam: true } });
    expect(shown.find('video.webcam-video').classes()).toContain('visible');
  });

  it('renders the mascot', () => {
    const wrapper = mount(TaskinWithShhh);
    expect(wrapper.find('.mascot-container').exists()).toBe(true);
    expect(wrapper.find('g#body').exists()).toBe(true);
  });

  it('renders the noise controls', () => {
    const wrapper = mount(TaskinWithShhh);
    expect(wrapper.find('[data-testid="mock-toggle-noise"]').exists()).toBe(true);
  });

  it('starts detection when the toggle button is clicked', async () => {
    const wrapper = mount(TaskinWithShhh);
    await wrapper.find('[data-testid="mock-toggle-tracking"]').trigger('click');
    expect(face.startDetection).toHaveBeenCalled();
  });
});
