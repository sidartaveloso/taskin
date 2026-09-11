import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { TrackingControlsProps } from './TrackingControls.types';
import { TRACKING_CONTROLS } from './TrackingControls.types';
import TrackingControls from './TrackingControls.vue';

/*
 * `controls` e obrigatorio, entao nao existe "montar sem dizer nada": os casos
 * que nao estao testando a filtragem passam a lista inteira de proposito.
 */
const todos = { controls: [...TRACKING_CONTROLS] };

describe('TrackingControls', () => {
  it('renders "Start Detection" when not detecting', () => {
    const wrapper = mount(TrackingControls, { props: todos });
    expect(wrapper.find('button.control-button').text()).toBe('Start Detection');
  });

  it('renders "Stop Detection" when detecting', () => {
    const wrapper = mount(TrackingControls, { props: { ...todos, isDetecting: true } });
    expect(wrapper.find('button.control-button').text()).toBe('Stop Detection');
  });

  it('emits toggle-tracking when the button is clicked', async () => {
    const wrapper = mount(TrackingControls, { props: todos });
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-tracking')).toHaveLength(1);
  });

  it('does not emit toggle-tracking when disabled', async () => {
    const wrapper = mount(TrackingControls, { props: { ...todos, disabled: true } });
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-tracking')).toBeUndefined();
  });

  it('emits update:showWebcam when the webcam checkbox changes', async () => {
    const wrapper = mount(TrackingControls, { props: todos });
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0]?.setValue(false);
    expect(wrapper.emitted('update:showWebcam')).toEqual([[false]]);
  });

  it('emits update:syncEyes when the eyes checkbox changes', async () => {
    const wrapper = mount(TrackingControls, { props: { ...todos, syncEyes: true } });
    await wrapper.findAll('input[type="checkbox"]')[1]?.setValue(false);
    expect(wrapper.emitted('update:syncEyes')).toEqual([[false]]);
  });

  it('shows the error message when error is set', () => {
    const wrapper = mount(TrackingControls, { props: { ...todos, error: 'Webcam denied' } });
    expect(wrapper.text()).toContain('Webcam denied');
  });

  it('shows the detecting status when isDetecting is true', () => {
    const wrapper = mount(TrackingControls, { props: { ...todos, isDetecting: true } });
    expect(wrapper.find('.status').text()).toContain('Detecting');
  });
});

describe('TrackingControls — quais controles ficam disponiveis', () => {
  const labelsOf = (wrapper: ReturnType<typeof mount>): string[] =>
    wrapper.findAll('.control-checkbox').map((label) => label.text());

  it('mostra os cinco controles quando a tela declara todos', () => {
    expect(labelsOf(mount(TrackingControls, { props: todos }))).toEqual([
      'Webcam',
      'Eyes',
      'Mouth',
      'Expressions',
      'Arms',
    ]);
  });

  it('mostra apenas os controles pedidos', () => {
    const wrapper = mount(TrackingControls, { props: { controls: ['eyes', 'mouth'] } });

    expect(labelsOf(wrapper)).toEqual(['Eyes', 'Mouth']);
  });

  it('mantem a ordem canonica, nao a ordem do array', () => {
    const wrapper = mount(TrackingControls, { props: { controls: ['arms', 'webcam', 'eyes'] } });

    expect(labelsOf(wrapper)).toEqual(['Webcam', 'Eyes', 'Arms']);
  });

  it('esconde o grupo inteiro quando nenhum item dele esta disponivel', () => {
    const semExibicao = mount(TrackingControls, { props: { controls: ['eyes'] } });
    expect(semExibicao.text()).not.toContain('Display');
    expect(semExibicao.text()).toContain('Sync');

    const semSincronismo = mount(TrackingControls, { props: { controls: ['webcam'] } });
    expect(semSincronismo.text()).toContain('Display');
    expect(semSincronismo.text()).not.toContain('Sync');
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

describe('TrackingControls — o contrato de nao oferecer o que nao existe', () => {
  it('nao lista um controle que nenhuma tela implementa', () => {
    /*
     * `gestures` viveu na lista sem que uma unica tela ligasse
     * `update:syncGestures` a coisa alguma: a caixa aparecia, aceitava clique e
     * nao fazia nada. Volta quando houver quem a implemente.
     */
    expect(TRACKING_CONTROLS).not.toContain('gestures');
  });

  it('exige que a tela declare o que implementa, em tempo de compilacao', () => {
    // @ts-expect-error — `controls` e obrigatorio: sem ele o props nao compila
    const semDeclarar: TrackingControlsProps = { syncEyes: true };

    expect(semDeclarar.controls).toBeUndefined();
  });
});
