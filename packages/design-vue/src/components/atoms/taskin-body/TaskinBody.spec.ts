import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinBody from './TaskinBody.vue';

describe('TaskinBody', () => {
  it('renders the body group with main and highlight ellipses', () => {
    const wrapper = mount(TaskinBody);
    expect(wrapper.find('g#body').exists()).toBe(true);
    expect(wrapper.find('#body-main').exists()).toBe(true);
    expect(wrapper.find('#body-highlight').exists()).toBe(true);
  });

  it('applies the body color to the main ellipse', () => {
    const wrapper = mount(TaskinBody, { props: { bodyColor: '#123456' } });
    expect(wrapper.find('#body-main').attributes('fill')).toBe('#123456');
  });

  it('applies the highlight color', () => {
    const wrapper = mount(TaskinBody, { props: { bodyHighlight: '#ABCDEF' } });
    expect(wrapper.find('#body-highlight').attributes('fill')).toBe('#ABCDEF');
  });

  it('adds the float class when float is enabled and animations are on', () => {
    const wrapper = mount(TaskinBody, { props: { float: true } });
    expect(wrapper.find('#body-main').classes()).toContain('body-float');
  });

  it('skips animation classes when animations are disabled', () => {
    const wrapper = mount(TaskinBody, { props: { float: true, bounce: true, animationsEnabled: false } });
    expect(wrapper.find('#body-main').classes()).not.toContain('body-float');
    expect(wrapper.find('#body-main').classes()).not.toContain('body-bounce');
  });
});
