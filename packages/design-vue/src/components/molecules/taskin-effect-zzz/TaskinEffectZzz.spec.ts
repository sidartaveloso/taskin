import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { SAPIN_CHARACTER } from '../../organisms/taskin/characters/sapin/sapin-character';
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

  it('sobe do olho direito do sapin', () => {
    // O primeiro Z tem a linha de base em (190, 90) no taskin e em (204, 71)
    // no sapin; o contorno comeca no canto de cima, 1.2 a direita e 17 acima.
    const taskin = mount(TaskinEffectZzz).find('path');
    const sapin = mount(TaskinEffectZzz, { props: { character: SAPIN_CHARACTER } }).find('path');

    expect(taskin.attributes('d')).toMatch(/^M191\.2 73h/);
    expect(sapin.attributes('d')).toMatch(/^M205\.2 54h/);
  });
});
