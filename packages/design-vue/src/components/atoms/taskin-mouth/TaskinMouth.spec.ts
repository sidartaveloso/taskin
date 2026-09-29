import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinMouth from './TaskinMouth.vue';

describe('TaskinMouth', () => {
  it('renders the mouth path', () => {
    const wrapper = mount(TaskinMouth);
    expect(wrapper.find('#mouth').exists()).toBe(true);
  });

  it('renders a different path per expression', () => {
    const neutral = mount(TaskinMouth, { props: { expression: 'neutral' } });
    const smile = mount(TaskinMouth, { props: { expression: 'smile' } });
    expect(neutral.find('#mouth').attributes('d')).not.toBe(smile.find('#mouth').attributes('d'));
  });

  it('fills the mouth for open expressions', () => {
    const openExpressions: Array<'open' | 'wide-open' | 'o-shape' | 'surprised' | 'panting'> = [
      'open',
      'wide-open',
      'o-shape',
      'surprised',
      'panting',
    ];
    for (const expression of openExpressions) {
      const wrapper = mount(TaskinMouth, { props: { expression } });
      expect(wrapper.find('#mouth').attributes('fill')).not.toBe('none');
    }
  });

  it('leaves neutral expressions unfilled', () => {
    const wrapper = mount(TaskinMouth, { props: { expression: 'neutral' } });
    expect(wrapper.find('#mouth').attributes('fill')).toBe('none');
  });

  it('fica mais alta no sapin, com a mesma expressao', () => {
    const taskin = mount(TaskinMouth, { props: { expression: 'smile' } });
    const sapin = mount(TaskinMouth, { props: { expression: 'smile', variant: 'sapin' } });

    expect(sapin.find('#mouth').attributes('d')).toBe(taskin.find('#mouth').attributes('d'));
    expect(sapin.find('#mouth').attributes('transform')).toBe('translate(0 -21)');
    expect(taskin.find('#mouth').attributes('transform')).toBeUndefined();
  });

  describe('ofegante', () => {
    it('poe a lingua para fora so no panting', () => {
      expect(
        mount(TaskinMouth, { props: { expression: 'panting' } })
          .find('#mouth-tongue')
          .exists(),
      ).toBe(true);
      expect(
        mount(TaskinMouth, { props: { expression: 'wide-open' } })
          .find('#mouth-tongue')
          .exists(),
      ).toBe(false);
    });

    it('nao e o sorriso escancarado do wide-open', () => {
      const panting = mount(TaskinMouth, { props: { expression: 'panting' } });
      const wideOpen = mount(TaskinMouth, { props: { expression: 'wide-open' } });
      expect(panting.find('#mouth').attributes('d')).not.toBe(wideOpen.find('#mouth').attributes('d'));
    });

    it('leva a lingua junto com a boca no sapin', () => {
      const taskin = mount(TaskinMouth, { props: { expression: 'panting' } });
      const sapin = mount(TaskinMouth, { props: { expression: 'panting', variant: 'sapin' } });

      expect(sapin.find('#mouth-tongue').attributes('transform')).toBe('translate(0 -21)');
      expect(taskin.find('#mouth-tongue').attributes('transform')).toBeUndefined();
    });

    it('mexe a lingua so com animacao ligada', () => {
      const lingua = (animationsEnabled: boolean) =>
        mount(TaskinMouth, { props: { expression: 'panting', animationsEnabled } })
          .find('#mouth-tongue path')
          .classes();

      expect(lingua(true)).toContain('tongue-pant');
      expect(lingua(false)).not.toContain('tongue-pant');
    });
  });
});
