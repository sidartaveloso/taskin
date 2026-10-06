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

  it('fica no lugar de sempre e na tinta do polvo, sem offset nem ink', () => {
    const wrapper = mount(TaskinMouth, { props: { expression: 'panting' } });

    expect(wrapper.find('#mouth').attributes('transform')).toBeUndefined();
    expect(wrapper.find('#mouth-tongue').attributes('transform')).toBeUndefined();
    expect(wrapper.find('#mouth').attributes('stroke')).toBe('#2C3E50');
  });

  it('o offset leva a boca e a lingua juntas, e o ink pinta as duas', () => {
    const wrapper = mount(TaskinMouth, {
      props: { expression: 'panting', offset: { x: 0, y: -10 }, ink: '#123456' },
    });
    const polvo = mount(TaskinMouth, { props: { expression: 'panting' } });

    expect(wrapper.find('#mouth').attributes('d')).toBe(polvo.find('#mouth').attributes('d'));
    expect(wrapper.find('#mouth').attributes('transform')).toBe('translate(0 -10)');
    expect(wrapper.find('#mouth-tongue').attributes('transform')).toBe('translate(0 -10)');
    expect(wrapper.find('#mouth').attributes('stroke')).toBe('#123456');
    expect(wrapper.find('#mouth-tongue path').attributes('stroke')).toBe('#123456');
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

    it('mexe a lingua so com animacao ligada', () => {
      const lingua = (animationsEnabled: boolean) =>
        mount(TaskinMouth, { props: { expression: 'panting', animationsEnabled } })
          .find('#mouth-tongue path')
          .classes();

      expect(lingua(true)).toContain('tongue-pant');
      expect(lingua(false)).not.toContain('tongue-pant');
    });
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
