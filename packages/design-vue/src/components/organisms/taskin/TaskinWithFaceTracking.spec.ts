import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import { createFaceLandmarkerMock, useFaceLandmarker } from '@opentask/ui-sense/mocks';
import TaskinWithFaceTracking from './TaskinWithFaceTracking.vue';

const baseBlendShapes = {
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
  eyeLookDownLeft: 0,
  eyeLookDownRight: 0,
  eyeLookInLeft: 0,
  eyeLookInRight: 0,
  eyeLookOutLeft: 0,
  eyeLookOutRight: 0,
  eyeLookUpLeft: 0,
  eyeLookUpRight: 0,
  eyeSquintLeft: 0,
  eyeSquintRight: 0,
  eyeWideLeft: 0,
  eyeWideRight: 0,
  jawOpen: 0,
  mouthClose: 1,
  mouthSmileLeft: 0,
  mouthSmileRight: 0,
  mouthFrownLeft: 0,
  mouthFrownRight: 0,
  mouthPucker: 0,
};

describe('TaskinWithFaceTracking', () => {
  let face: ReturnType<typeof createFaceLandmarkerMock>;

  beforeEach(() => {
    face = createFaceLandmarkerMock();
    vi.mocked(useFaceLandmarker).mockReturnValue(face);
  });

  it('renders the webcam hidden by default and visible when showWebcam is true', () => {
    const hidden = mount(TaskinWithFaceTracking, { props: { showWebcam: false } });
    expect(hidden.find('video.webcam-video').classes()).not.toContain('visible');

    const shown = mount(TaskinWithFaceTracking, { props: { showWebcam: true } });
    expect(shown.find('video.webcam-video').classes()).toContain('visible');
  });

  it('renders the mascot', () => {
    const wrapper = mount(TaskinWithFaceTracking);
    expect(wrapper.find('.mascot-container').exists()).toBe(true);
    expect(wrapper.find('g#body').exists()).toBe(true);
  });

  it('shows the debug panel when showDebug and detection data exists', async () => {
    const wrapper = mount(TaskinWithFaceTracking, { props: { showDebug: true } });
    expect(wrapper.find('[data-testid="mock-face-tracking-debug"]').exists()).toBe(false);

    face.state.value.blendShapes = baseBlendShapes;
    await nextTick();
    await nextTick();
    expect(wrapper.find('[data-testid="mock-face-tracking-debug"]').exists()).toBe(true);
  });

  it('starts detection when the toggle button is clicked', async () => {
    const wrapper = mount(TaskinWithFaceTracking);
    await wrapper.find('[data-testid="mock-toggle-tracking"]').trigger('click');
    expect(face.startDetection).toHaveBeenCalled();
  });

  it('stops detection when the toggle button is clicked while detecting', async () => {
    face.state.value.isDetecting = true;
    const wrapper = mount(TaskinWithFaceTracking);
    await wrapper.find('[data-testid="mock-toggle-tracking"]').trigger('click');
    expect(face.stopDetection).toHaveBeenCalled();
  });
});
