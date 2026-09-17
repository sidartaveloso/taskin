import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import { createFaceLandmarkerMock, shhhVoiceMock, useFaceLandmarker } from '@opentask/ui-sense/mocks';
import TaskinWithShhh from './TaskinWithShhh.vue';

describe('TaskinWithShhh', () => {
  let face: ReturnType<typeof createFaceLandmarkerMock>;

  beforeEach(() => {
    face = createFaceLandmarkerMock();
    vi.mocked(useFaceLandmarker).mockReturnValue(face);
    vi.mocked(shhhVoiceMock.shush).mockClear();
  });

  /**
   * Dispara a reacao pelo caminho de verdade: a heuristica de "shhh" olha a boca
   * fechada com pouco sorriso e pouca carranca, entao basta alimentar as
   * blendshapes correspondentes.
   */
  const pedirSilencio = async (wrapper: ReturnType<typeof mount>) => {
    face.state.value = { ...face.state.value, blendShapes: [] as never };
    await wrapper.vm.$nextTick();
  };

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

  it('mostra a frase configurada no balao, e nao um "shh" generico', async () => {
    const wrapper = mount(TaskinWithShhh, { props: { shhhPhrase: 'Bruno, Shhhhhhhhhhhh...' } });

    await pedirSilencio(wrapper);

    expect(wrapper.text()).toContain('Bruno, Shhhhhhhhhhhh...');
  });

  it('fala alto quando o som esta ligado — o interruptor precisa fazer alguma coisa', async () => {
    const wrapper = mount(TaskinWithShhh, {
      props: { noiseSound: true, shhhPhrase: 'Bruno, Shhhhhhhhhhhh...', shhhVolume: 0.8 },
    });

    await pedirSilencio(wrapper);

    expect(shhhVoiceMock.shush).toHaveBeenCalledWith({ phrase: 'Bruno, Shhhhhhhhhhhh...', volume: 0.8 });
  });

  it('fica calado quando o som esta desligado, mas ainda mostra o balao', async () => {
    const wrapper = mount(TaskinWithShhh, { props: { noiseSound: false } });

    await pedirSilencio(wrapper);

    expect(shhhVoiceMock.shush).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Shhhhhh...');
  });

  it('le a frase do bloco mascot do .taskin.json quando ele vem', async () => {
    const wrapper = mount(TaskinWithShhh, {
      props: {
        mascot: { reactions: { noise: { enabled: true, sound: true, phrase: 'Pessoal, Shhhhh...' } } },
      },
    });

    await pedirSilencio(wrapper);

    expect(wrapper.text()).toContain('Pessoal, Shhhhh...');
  });
});
