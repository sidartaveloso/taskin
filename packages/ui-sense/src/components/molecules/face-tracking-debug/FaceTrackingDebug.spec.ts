import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FaceTrackingDebug from './FaceTrackingDebug.vue';

describe('FaceTrackingDebug', () => {
  it('renders nothing when data is null', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: null } });
    expect(wrapper.find('.face-tracking-debug').exists()).toBe(false);
  });

  it('renders nothing when data is undefined', () => {
    const wrapper = mount(FaceTrackingDebug);
    expect(wrapper.find('.face-tracking-debug').exists()).toBe(false);
  });

  it('renders the panel when data is provided', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: { eye: 'closed' } } });
    expect(wrapper.find('.face-tracking-debug').exists()).toBe(true);
  });

  it('renders the title', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: {}, title: 'Debug Panel' } });
    expect(wrapper.find('h4').text()).toBe('Debug Panel');
  });

  it('uses a default title when not provided', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: {} } });
    expect(wrapper.find('h4').text()).toBe('Debug Info');
  });

  it('applies the position class', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: {}, position: 'bottom-left' } });
    expect(wrapper.find('.face-tracking-debug').classes()).toContain('bottom-left');
  });

  it('renders the data as preformatted text', () => {
    const wrapper = mount(FaceTrackingDebug, { props: { data: { alpha: 1 } } });
    expect(wrapper.find('pre').text()).toContain('"alpha"');
  });
});
