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
    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true);
    expect(wrapper.emitted('update:enableNoiseReactions')).toEqual([[true]]);
  });

  it('emits update:noiseThreshold on range input', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('input[type="range"]').setValue('0.1');
    expect(wrapper.emitted('update:noiseThreshold')).toEqual([[0.1]]);
  });

  it('emits update:noiseDebounceMs on debounce change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.find('input[type="number"]').setValue('2000');
    expect(wrapper.emitted('update:noiseDebounceMs')).toEqual([[2000]]);
  });

  it('emits update:noiseSound on sound checkbox change', async () => {
    const wrapper = mount(NoiseTrackingControls);
    await wrapper.findAll('input[type="checkbox"]')[1].setValue(true);
    expect(wrapper.emitted('update:noiseSound')).toEqual([[true]]);
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
