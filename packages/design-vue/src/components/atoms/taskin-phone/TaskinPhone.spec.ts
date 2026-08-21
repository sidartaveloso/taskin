import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinPhone from './TaskinPhone.vue';

describe('TaskinPhone', () => {
  it('renders a phone group with body, screen and speaker', () => {
    const wrapper = mount(TaskinPhone);
    expect(wrapper.find('g#phone').exists()).toBe(true);
    expect(wrapper.findAll('rect')).toHaveLength(2);
    expect(wrapper.find('circle').exists()).toBe(true);
  });

  it('applies the phone color to the body rect', () => {
    const wrapper = mount(TaskinPhone, { props: { phoneColor: '#FF0000' } });
    expect(wrapper.find('rect').attributes('fill')).toBe('#FF0000');
  });

  it('applies the screen color', () => {
    const wrapper = mount(TaskinPhone, { props: { screenColor: '#00FF00' } });
    const rects = wrapper.findAll('rect');
    expect(rects[1].attributes('fill')).toBe('#00FF00');
  });
});
