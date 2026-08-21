import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectFartCloud from './TaskinEffectFartCloud';

describe('TaskinEffectFartCloud', () => {
  it('renders the fart cloud with four circles', () => {
    const wrapper = mount(TaskinEffectFartCloud);
    expect(wrapper.find('g#effect-fart-cloud').exists()).toBe(true);
    expect(wrapper.findAll('circle')).toHaveLength(4);
  });

  it('applies the expand animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectFartCloud);
    expect(wrapper.find('circle').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectFartCloud, { props: { animationsEnabled: false } });
    expect(wrapper.find('circle').attributes('style')).not.toContain('animation');
  });
});
