import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectVomit from './TaskinEffectVomit';

describe('TaskinEffectVomit', () => {
  it('renders the vomit effect with five drops', () => {
    const wrapper = mount(TaskinEffectVomit);
    expect(wrapper.find('g#effect-vomit').exists()).toBe(true);
    expect(wrapper.findAll('ellipse')).toHaveLength(5);
  });

  it('applies the drop animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectVomit);
    expect(wrapper.find('ellipse').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectVomit, { props: { animationsEnabled: false } });
    expect(wrapper.find('ellipse').attributes('style')).not.toContain('animation');
  });
});
