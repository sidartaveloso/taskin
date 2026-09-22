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
    const wrapper = mount(TaskinWithShhh, { props: { shhhPhrase: 'Shhhhhhhhhhhh...' } });

    await pedirSilencio(wrapper);

    expect(wrapper.text()).toContain('Shhhhhhhhhhhh...');
  });

  /*
   * O balao mostra a frase inteira, com o nome na frente; a voz so pronuncia o
   * nome. Sao papeis diferentes de propriedades diferentes.
   */
  it('junta o nome a frase no balao', async () => {
    const wrapper = mount(TaskinWithShhh, {
      props: { shhhName: 'Bruno', shhhPhrase: 'Shhhhhhhhhhhh...' },
    });

    await pedirSilencio(wrapper);

    expect(wrapper.find('#effect-thought-bubble text').text()).toBe('Bruno, Shhhhhhhhhhhh...');
  });

  it('mostra so a frase quando nao ha nome a chamar', async () => {
    const wrapper = mount(TaskinWithShhh, { props: { shhhPhrase: 'Shhhhhhhhhhhh...' } });

    await pedirSilencio(wrapper);

    // no balao, e nao em `wrapper.text()`: o painel de controles em volta tem
    // texto proprio e virgulas que nao dizem nada sobre esta regra
    expect(wrapper.find('#effect-thought-bubble text').text()).toBe('Shhhhhhhhhhhh...');
  });

  it('fala alto quando o som esta ligado — o interruptor precisa fazer alguma coisa', async () => {
    const wrapper = mount(TaskinWithShhh, {
      props: { noiseSound: true, shhhName: 'Bruno', shhhPhrase: 'Shhhhhhhhhhhh...', shhhVolume: 0.8 },
    });

    await pedirSilencio(wrapper);

    // nome e frase vao separados: e a voz que decide o que pronunciar e quando
    expect(shhhVoiceMock.shush).toHaveBeenCalledWith({
      name: 'Bruno',
      phrase: 'Shhhhhhhhhhhh...',
      volume: 0.8,
    });
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

  it('esconde os controles quando pedido — e assim que ele vive num celular', () => {
    const wrapper = mount(TaskinWithShhh, { props: { showControls: false } });

    expect(wrapper.find('[data-testid="mock-toggle-noise"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="mock-toggle-tracking"]').exists()).toBe(false);
    expect(wrapper.find('.mascot-container').exists()).toBe(true);
  });

  it('le a sustentacao e o nome do bloco mascot, que agora os carrega', async () => {
    const wrapper = mount(TaskinWithShhh, {
      props: {
        mascot: {
          reactions: {
            noise: { enabled: true, sound: true, name: 'Bruno', sustainMs: 2000, sustainRatio: 0.4 },
          },
        },
      },
    });

    await pedirSilencio(wrapper);

    expect(shhhVoiceMock.shush).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bruno' }));
  });
});
