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
