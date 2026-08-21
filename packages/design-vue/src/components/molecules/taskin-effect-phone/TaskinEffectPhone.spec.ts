import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectPhone from './TaskinEffectPhone';

describe('TaskinEffectPhone', () => {
  it('renders the phone shake effect with a phone child', () => {
    const wrapper = mount(TaskinEffectPhone);
    expect(wrapper.find('g#effect-phone').exists()).toBe(true);
    expect(wrapper.find('g#phone').exists()).toBe(true);
  });

  it('applies the shake animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectPhone);
    expect(wrapper.find('g#effect-phone').attributes('style')).toContain('phone-shake');
  });

  it('omits the shake animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectPhone, { props: { animationsEnabled: false } });
    expect(wrapper.find('g#effect-phone').attributes('style')).not.toContain('phone-shake');
  });
});
