import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinArms from './TaskinArms.vue';

describe('TaskinArms', () => {
  it('renders left and right arm paths', () => {
    const wrapper = mount(TaskinArms);
    expect(wrapper.find('g#arms').exists()).toBe(true);
    expect(wrapper.find('#left-arm').exists()).toBe(true);
    expect(wrapper.find('#right-arm').exists()).toBe(true);
  });

  it('applies the arm color as stroke', () => {
    const wrapper = mount(TaskinArms, { props: { color: '#00FF00' } });
    expect(wrapper.find('#left-arm').attributes('stroke')).toBe('#00FF00');
    expect(wrapper.find('#right-arm').attributes('stroke')).toBe('#00FF00');
  });

  it('renders different path data when arm positions change', () => {
    const neutral = mount(TaskinArms);
    const raised = mount(TaskinArms, {
      props: {
        leftArmPosition: { shoulderAngle: 10, elbowAngle: 5, wristAngle: 0 },
        rightArmPosition: { shoulderAngle: 15, elbowAngle: 8, wristAngle: -5 },
      },
    });
    expect(neutral.find('#left-arm').attributes('d')).not.toBe(raised.find('#left-arm').attributes('d'));
    expect(neutral.find('#right-arm').attributes('d')).not.toBe(raised.find('#right-arm').attributes('d'));
  });
});
