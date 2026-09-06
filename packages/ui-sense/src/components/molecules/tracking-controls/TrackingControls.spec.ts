import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TrackingControls from './TrackingControls.vue';

describe('TrackingControls', () => {
  it('renders "Iniciar Detecção" when not detecting', () => {
    const wrapper = mount(TrackingControls);
    expect(wrapper.find('button.control-button').text()).toBe('Iniciar Detecção');
  });

  it('renders "Parar Detecção" when detecting', () => {
    const wrapper = mount(TrackingControls, { props: { isDetecting: true } });
    expect(wrapper.find('button.control-button').text()).toBe('Parar Detecção');
  });

  it('emits toggle-tracking when the button is clicked', async () => {
    const wrapper = mount(TrackingControls);
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-tracking')).toHaveLength(1);
  });

  it('does not emit toggle-tracking when disabled', async () => {
    const wrapper = mount(TrackingControls, { props: { disabled: true } });
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-tracking')).toBeUndefined();
  });

  it('emits update:showWebcam when the webcam checkbox changes', async () => {
    const wrapper = mount(TrackingControls);
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0]?.setValue(false);
    expect(wrapper.emitted('update:showWebcam')).toEqual([[false]]);
  });

  it('emits update:syncEyes when the eyes checkbox changes', async () => {
    const wrapper = mount(TrackingControls, { props: { syncEyes: true } });
    await wrapper.findAll('input[type="checkbox"]')[1]?.setValue(false);
    expect(wrapper.emitted('update:syncEyes')).toEqual([[false]]);
  });

  it('shows the error message when error is set', () => {
    const wrapper = mount(TrackingControls, { props: { error: 'Webcam denied' } });
    expect(wrapper.text()).toContain('Webcam denied');
  });

  it('shows the detecting status when isDetecting is true', () => {
    const wrapper = mount(TrackingControls, { props: { isDetecting: true } });
    expect(wrapper.find('.status').text()).toContain('Detectando');
  });
});

describe('TrackingControls — quais controles ficam disponiveis', () => {
  const labelsOf = (wrapper: ReturnType<typeof mount>): string[] =>
    wrapper.findAll('.control-checkbox').map((label) => label.text());

  it('mostra os seis controles quando nada e informado', () => {
    expect(labelsOf(mount(TrackingControls))).toEqual(['Webcam', 'Olhos', 'Boca', 'Expressões', 'Braços', 'Gestos']);
  });

  it('mostra apenas os controles pedidos', () => {
    const wrapper = mount(TrackingControls, { props: { controls: ['eyes', 'mouth'] } });

    expect(labelsOf(wrapper)).toEqual(['Olhos', 'Boca']);
  });

  it('mantem a ordem canonica, nao a ordem do array', () => {
    const wrapper = mount(TrackingControls, { props: { controls: ['gestures', 'webcam', 'eyes'] } });

    expect(labelsOf(wrapper)).toEqual(['Webcam', 'Olhos', 'Gestos']);
  });

  it('esconde o grupo inteiro quando nenhum item dele esta disponivel', () => {
    const semExibicao = mount(TrackingControls, { props: { controls: ['eyes'] } });
    expect(semExibicao.text()).not.toContain('Exibição');
    expect(semExibicao.text()).toContain('Sincronizar');

    const semSincronismo = mount(TrackingControls, { props: { controls: ['webcam'] } });
    expect(semSincronismo.text()).toContain('Exibição');
    expect(semSincronismo.text()).not.toContain('Sincronizar');
  });

  it('nao emite por um controle que foi escondido', async () => {
    // `setValue` so dispara `change` quando o valor muda, dai o `syncEyes: true`
    const wrapper = mount(TrackingControls, { props: { controls: ['eyes'], syncEyes: true } });

    await wrapper.findAll('input[type="checkbox"]')[0]?.setValue(false);

    expect(wrapper.emitted('update:syncEyes')).toEqual([[false]]);
    expect(wrapper.emitted('update:showWebcam')).toBeUndefined();
  });

  it('continua sem checkbox nenhum, mas com o botao, se a lista for vazia', () => {
    const wrapper = mount(TrackingControls, { props: { controls: [] } });

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0);
    expect(wrapper.find('button.control-button').exists()).toBe(true);
  });
});
