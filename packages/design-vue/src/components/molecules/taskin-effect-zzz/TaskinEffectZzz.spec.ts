import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectZzz from './TaskinEffectZzz';

describe('TaskinEffectZzz', () => {
  it('draws three Z shapes, as paths and not text', () => {
    const wrapper = mount(TaskinEffectZzz);
    expect(wrapper.find('g#effect-zzz').exists()).toBe(true);
    expect(wrapper.findAll('path')).toHaveLength(3);
    expect(wrapper.findAll('text')).toHaveLength(0);
  });

  it('applies the rise animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectZzz);
    expect(wrapper.find('path').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectZzz, { props: { animationsEnabled: false } });
    expect(wrapper.find('path').attributes('style')).not.toContain('animation');
  });
});
