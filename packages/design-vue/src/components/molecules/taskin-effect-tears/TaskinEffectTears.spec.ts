import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { SAPIN_CHARACTER } from '../../organisms/taskin/characters/sapin/sapin-character';
import TaskinEffectTears from './TaskinEffectTears';

describe('TaskinEffectTears', () => {
  it('renders the tears effect with two drops', () => {
    const wrapper = mount(TaskinEffectTears);
    expect(wrapper.find('g#effect-tears').exists()).toBe(true);
    expect(wrapper.findAll('circle')).toHaveLength(2);
  });

  it('renders blue drops', () => {
    const wrapper = mount(TaskinEffectTears);
    expect(wrapper.find('circle').attributes('fill')).toBe('#4A90E2');
  });

  it('applies the drop animation when animations are enabled', () => {
    const wrapper = mount(TaskinEffectTears);
    expect(wrapper.find('circle').attributes('style')).toContain('animation');
  });

  it('omits the animation when animations are disabled', () => {
    const wrapper = mount(TaskinEffectTears, { props: { animationsEnabled: false } });
    expect(wrapper.find('circle').attributes('style')).not.toContain('animation');
  });

  it('cai dos olhos do sapin, que ficam mais altos e mais afastados', () => {
    const taskin = mount(TaskinEffectTears).findAll('circle');
    const sapin = mount(TaskinEffectTears, { props: { character: SAPIN_CHARACTER } }).findAll('circle');

    expect(taskin.map((c) => [c.attributes('cx'), c.attributes('cy')])).toEqual([
      ['148', '105'],
      ['172', '105'],
    ]);
    expect(sapin.map((c) => [c.attributes('cx'), c.attributes('cy')])).toEqual([
      ['134', '86'],
      ['186', '86'],
    ]);
  });
});
