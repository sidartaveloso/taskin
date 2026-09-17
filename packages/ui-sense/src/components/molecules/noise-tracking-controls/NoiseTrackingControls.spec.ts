import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import NoiseTrackingControls from './NoiseTrackingControls.vue';

describe('NoiseTrackingControls', () => {
  it('renders "Start Noise Watcher" when inactive', () => {
    const wrapper = mount(NoiseTrackingControls);
    expect(wrapper.find('button.control-button').text()).toBe('Start Noise Watcher');
  });

  it('renders "Stop Noise Watcher" when active', () => {
    const wrapper = mount(NoiseTrackingControls, { props: { isActive: true } });
    expect(wrapper.find('button.control-button').text()).toBe('Stop Noise Watcher');
  });

  it('emits toggle-noise when the button is clicked', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-noise')).toHaveLength(1);
  });

  it('does not emit toggle-noise when disabled', async () => {
    const wrapper = mount(NoiseTrackingControls, { props: { disabled: true } });
    await wrapper.find('button.control-button').trigger('click');
    expect(wrapper.emitted('toggle-noise')).toBeUndefined();
  });

  it('emits update:enableNoiseReactions on checkbox change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.findAll('input[type="checkbox"]')[0]?.setValue(true);
    expect(wrapper.emitted('update:enableNoiseReactions')).toEqual([[true]]);
  });

  it('emits update:noiseThreshold on range input', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('input[type="range"]').setValue('0.1');
    expect(wrapper.emitted('update:noiseThreshold')).toEqual([[0.1]]);
  });

  it('emits update:noiseDebounceMs on debounce change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('[data-field="debounce"]').setValue('2000');
    expect(wrapper.emitted('update:noiseDebounceMs')).toEqual([[2000]]);
  });

  /*
   * Sustentacao e debounce sao dois tempos diferentes e ficam em campos
   * separados: um diz por quanto tempo o barulho precisa se manter alto antes
   * do primeiro pedido de silencio, o outro quanto tempo passa ate o proximo.
   */
  it('emits update:noiseSustainMs on sustain change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('[data-field="sustain"]').setValue('3000');
    expect(wrapper.emitted('update:noiseSustainMs')).toEqual([[3000]]);
  });

  it('shows the sustain value it was given', () => {
    const wrapper = mount(NoiseTrackingControls, { props: { noiseSustainMs: 2500 } });
    expect((wrapper.find('[data-field="sustain"]').element as HTMLInputElement).value).toBe('2500');
  });

  it('emits update:noiseSound on sound checkbox change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.findAll('input[type="checkbox"]')[1]?.setValue(true);
    expect(wrapper.emitted('update:noiseSound')).toEqual([[true]]);
  });

  /*
   * Ajustar frase, voz e volume junto com o detector nao diz qual dos dois
   * esta errado. O botao dispara a reacao sem passar pelo detector, e e o que
   * permite calibrar o estilo sem gritar na sala.
   */
  it('emits trigger-shhh when the test button is clicked', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('[data-action="trigger-shhh"]').trigger('click');
    expect(wrapper.emitted('trigger-shhh')).toHaveLength(1);
  });

  it('keeps the test button usable with the microphone off', () => {
    const wrapper = mount(NoiseTrackingControls, { props: { isActive: false, enableNoiseReactions: false } });
    expect((wrapper.find('[data-action="trigger-shhh"]').element as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the error message when error is set', () => {
    const wrapper = mount(NoiseTrackingControls, { props: { error: 'mic unavailable' } });
    expect(wrapper.text()).toContain('mic unavailable');
  });

  it('shows the listening status when active', () => {
    const wrapper = mount(NoiseTrackingControls, { props: { isActive: true } });
    expect(wrapper.find('.status').text()).toContain('Listening');
  });
});
