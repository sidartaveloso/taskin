import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectHearts from './TaskinEffectHearts';

describe('TaskinEffectHearts', () => {
  it('renders three hearts', () => {
    const wrapper = mount(TaskinEffectHearts);
    expect(wrapper.find('g#effect-hearts').exists()).toBe(true);
    const hearts = wrapper.findAll('text');
    expect(hearts).toHaveLength(3);
    for (const heart of hearts) {
      expect(heart.text()).toBe('❤');
    }
  });

  it('applies the float animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectHearts);
    expect(wrapper.find('text').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectHearts, { props: { animationsEnabled: false } });
    expect(wrapper.find('text').attributes('style')).not.toContain('animation');
  });

  it('acompanha os olhos do sapin', () => {
    const sapin = mount(TaskinEffectHearts, { props: { variant: 'sapin' } }).findAll('text');

    expect(sapin.map((t) => [t.attributes('x'), t.attributes('y')])).toEqual([
      ['106', '71'],
      ['209', '71'],
      ['150', '51'],
    ]);
  });
});
