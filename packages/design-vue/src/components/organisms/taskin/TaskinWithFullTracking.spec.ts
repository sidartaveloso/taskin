import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import { createFaceLandmarkerMock, createPoseLandmarkerMock, useFaceLandmarker, usePoseLandmarker } from '@opentask/ui-sense/mocks';
import TaskinWithFullTracking from './TaskinWithFullTracking.vue';

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

const armAngles = {
  left: { shoulder: 35, elbow: 30, wrist: -45 },
  right: { shoulder: 35, elbow: 30, wrist: -45 },
};

describe('TaskinWithFullTracking', () => {
  let face: ReturnType<typeof createFaceLandmarkerMock>;
  let pose: ReturnType<typeof createPoseLandmarkerMock>;

  beforeEach(() => {
    face = createFaceLandmarkerMock();
    pose = createPoseLandmarkerMock();
    vi.mocked(useFaceLandmarker).mockReturnValue(face);
    vi.mocked(usePoseLandmarker).mockReturnValue(pose);
  });

  it('renders the webcam hidden by default and visible when showWebcam is true', () => {
    const hidden = mount(TaskinWithFullTracking, { props: { showWebcam: false } });
    expect(hidden.find('video.webcam-video').classes()).not.toContain('visible');

    const shown = mount(TaskinWithFullTracking, { props: { showWebcam: true } });
    expect(shown.find('video.webcam-video').classes()).toContain('visible');
  });

  it('renders the mascot', () => {
    const wrapper = mount(TaskinWithFullTracking);
    expect(wrapper.find('.mascot-container').exists()).toBe(true);
    expect(wrapper.find('g#body').exists()).toBe(true);
  });

  it('shows the debug panel when showDebug and face and pose data exist', async () => {
    const wrapper = mount(TaskinWithFullTracking, { props: { showDebug: true } });
    expect(wrapper.find('[data-testid="mock-face-tracking-debug"]').exists()).toBe(false);

    vi.mocked(pose.getArmAngles).mockReturnValue(armAngles);
    face.state.value.blendShapes = baseBlendShapes;
    await nextTick();
    await nextTick();
    expect(wrapper.find('[data-testid="mock-face-tracking-debug"]').exists()).toBe(true);
  });

  it('starts both detectors when the toggle button is clicked', async () => {
    const wrapper = mount(TaskinWithFullTracking);
    await wrapper.find('[data-testid="mock-toggle-tracking"]').trigger('click');
    expect(face.startDetection).toHaveBeenCalled();
    expect(pose.startDetection).toHaveBeenCalled();
  });

  it('stops both detectors when toggled off', async () => {
    face.state.value.isDetecting = true;
    const wrapper = mount(TaskinWithFullTracking);
    await wrapper.find('[data-testid="mock-toggle-tracking"]').trigger('click');
    expect(face.stopDetection).toHaveBeenCalled();
    expect(pose.stopDetection).toHaveBeenCalled();
  });
});
