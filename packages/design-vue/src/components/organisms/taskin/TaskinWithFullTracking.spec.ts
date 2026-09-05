import type { ArmAngles } from '@opentask/ui-sense';
import { screenAngle } from '@opentask/ui-sense';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import {
  createFaceLandmarkerMock,
  createPoseLandmarkerMock,
  useFaceLandmarker,
  usePoseLandmarker,
} from '@opentask/ui-sense/mocks';
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

/*
 * Espaco de tela, que e o que a pose mede: 145deg e 35deg descrevem a mesma
 * pose simetrica, um lado de cada vez.
 */
const armAngles: ArmAngles = {
  left: { shoulder: screenAngle(145), elbow: 30, wrist: screenAngle(145) },
  right: { shoulder: screenAngle(35), elbow: 30, wrist: screenAngle(35) },
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

  /*
   * O teste que faltava, e que teria pegado o bug da task-044: pose entra, path
   * sai. Nenhum dos testes anteriores olhava a geometria desenhada, entao o
   * braco esquerdo cruzou o corpo por meses sem ninguem notar.
   */
  it('draws each elbow outside the body for a symmetric arms-down pose', async () => {
    const wrapper = mount(TaskinWithFullTracking);

    // Espaco de tela: 145deg do lado esquerdo e 35deg do direito, a mesma pose
    vi.mocked(pose.getArmAngles).mockReturnValue({
      left: { shoulder: screenAngle(145), elbow: 160, wrist: screenAngle(145) },
      right: { shoulder: screenAngle(35), elbow: 160, wrist: screenAngle(35) },
    });
    /*
     * Varios frames de proposito: a suavizacao fecha 35% da distancia por
     * frame, e um unico frame partindo do neutro chega perto o bastante do
     * lugar certo para a assercao passar mesmo com a conversao quebrada — foi o
     * que aconteceu com a primeira versao deste teste.
     */
    for (let frame = 0; frame < 20; frame += 1) {
      pose.state.value.landmarks = [{ x: frame, y: 0, z: 0, visibility: 1 }];
      await nextTick();
    }

    const elbowXOf = (id: string): number => {
      const path = wrapper.find(id).attributes('d') ?? '';
      return Number(path.match(/Q(-?\d+(?:\.\d+)?)/)?.[1]);
    };

    // Ombros do mascote ficam em x=95 (esquerdo) e x=225 (direito)
    expect(elbowXOf('#left-arm')).toBeLessThan(95);
    expect(elbowXOf('#right-arm')).toBeGreaterThan(225);
  });
});
