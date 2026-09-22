import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinArmWithPhone from './TaskinArmWithPhone.vue';

describe('TaskinArmWithPhone', () => {
  it('renders left and right arm groups', () => {
    const wrapper = mount(TaskinArmWithPhone);
    expect(wrapper.find('g#arm-with-item').exists()).toBe(true);
    expect(wrapper.find('g#left-arm-group').exists()).toBe(true);
    expect(wrapper.find('g#right-arm-group').exists()).toBe(true);
  });

  it('applies the arm color', () => {
    const wrapper = mount(TaskinArmWithPhone, { props: { armColor: '#FF00FF' } });
    expect(wrapper.find('#left-arm').attributes('stroke')).toBe('#FF00FF');
  });

  it('renders a phone by default in the right slot', () => {
    const wrapper = mount(TaskinArmWithPhone);
    expect(wrapper.find('g#right-arm-group g#phone').exists()).toBe(true);
  });

  it('renders a phone on the left when itemOnLeft is set', () => {
    const wrapper = mount(TaskinArmWithPhone, { props: { itemOnLeft: true } });
    expect(wrapper.find('g#left-arm-group g#phone').exists()).toBe(true);
  });

  it('applies the arm group rotation', () => {
    const wrapper = mount(TaskinArmWithPhone, { props: { leftArmRotation: 30 } });
    expect(wrapper.find('g#left-arm-group').attributes('transform')).toContain('rotate(30');
  });
});
