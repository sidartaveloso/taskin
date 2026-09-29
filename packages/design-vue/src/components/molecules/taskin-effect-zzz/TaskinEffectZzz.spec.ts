import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectZzz from './TaskinEffectZzz';

describe('TaskinEffectZzz', () => {
  it('renders three Z texts', () => {
    const wrapper = mount(TaskinEffectZzz);
    expect(wrapper.find('g#effect-zzz').exists()).toBe(true);
    const texts = wrapper.findAll('text');
    expect(texts).toHaveLength(3);
    for (const t of texts) {
      expect(t.text()).toBe('Z');
    }
  });

  it('applies the rise animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectZzz);
    expect(wrapper.find('text').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectZzz, { props: { animationsEnabled: false } });
    expect(wrapper.find('text').attributes('style')).not.toContain('animation');
  });

  it('sobe do olho direito do sapin', () => {
    const taskin = mount(TaskinEffectZzz).find('text');
    const sapin = mount(TaskinEffectZzz, { props: { variant: 'sapin' } }).find('text');

    expect([taskin.attributes('x'), taskin.attributes('y')]).toEqual(['190', '90']);
    expect([sapin.attributes('x'), sapin.attributes('y')]).toEqual(['204', '71']);
  });
});
