import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { MOUTH_PATHS } from './TaskinMouth.types';
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

  it('pinta a boca do sapin de verde-escuro, e a do taskin segue azul-escura', () => {
    const sapin = mount(TaskinMouth, { props: { expression: 'panting', variant: 'sapin' } });
    const taskin = mount(TaskinMouth, { props: { expression: 'panting' } });

    expect(sapin.find('#mouth').attributes('stroke')).toBe('#134635');
    expect(sapin.find('#mouth').attributes('fill')).toBe('#134635');
    expect(sapin.find('#mouth-tongue path').attributes('stroke')).toBe('#134635');
    expect(taskin.find('#mouth').attributes('stroke')).toBe('#2C3E50');
  });

  describe('falando', () => {
    it('anima a boca so com speaking', () => {
      expect(mount(TaskinMouth).find('#mouth').classes()).not.toContain('mouth-speaking');
      expect(
        mount(TaskinMouth, { props: { speaking: true } })
          .find('#mouth')
          .classes(),
      ).toContain('mouth-speaking');
    });

    it('alterna entre o caminho da expressao e o do open, da mesma tabela', () => {
      const falando = mount(TaskinMouth, { props: { expression: 'smile', speaking: true } }).find('#mouth');
      const style = falando.attributes('style') ?? '';

      expect(style).toContain(`--mouth-rest: path("${MOUTH_PATHS.smile}")`);
      expect(style).toContain(`--mouth-open: path("${MOUTH_PATHS.open}")`);
      expect(falando.attributes('d')).toBe(MOUTH_PATHS.smile);
    });

    it('roda a animacao no navegador', () => {
      const wrapper = mount(TaskinMouth, { attachTo: document.body, props: { speaking: true } });
      const boca = wrapper.find('#mouth').element as SVGPathElement;
      const [animacao] = boca.getAnimations() as CSSAnimation[];

      // o nome ganha o sufixo do `scoped`
      expect(animacao?.animationName).toMatch(/^mouth-speak/);
      animacao?.pause();
      if (animacao) animacao.currentTime = 0;
      const fechada = getComputedStyle(boca).getPropertyValue('d');
      if (animacao) animacao.currentTime = 120;
      const aberta = getComputedStyle(boca).getPropertyValue('d');

      expect(fechada).not.toBe(aberta);
      expect(aberta).toContain('M 152 122');
      wrapper.unmount();
    });

    it('sem animacao, fica na expressao', () => {
      const boca = mount(TaskinMouth, {
        props: { expression: 'smile', speaking: true, animationsEnabled: false },
      }).find('#mouth');

      expect(boca.classes()).not.toContain('mouth-speaking');
      expect(boca.attributes('style')).toBeUndefined();
      expect(boca.attributes('d')).toBe(MOUTH_PATHS.smile);
    });
  });
});
