import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { EYE_GEOMETRY } from '../taskin-eyes/TaskinEyes.types';
import TaskinBody from './TaskinBody.vue';

describe('TaskinBody', () => {
  it('renders the body group with main and highlight ellipses', () => {
    const wrapper = mount(TaskinBody);
    expect(wrapper.find('g#body').exists()).toBe(true);
    expect(wrapper.find('#body-main').exists()).toBe(true);
    expect(wrapper.find('#body-highlight').exists()).toBe(true);
  });

  it('applies the body color to the main ellipse', () => {
    const wrapper = mount(TaskinBody, { props: { bodyColor: '#123456' } });
    expect(wrapper.find('#body-main').attributes('fill')).toBe('#123456');
  });

  it('applies the highlight color', () => {
    const wrapper = mount(TaskinBody, { props: { bodyHighlight: '#ABCDEF' } });
    expect(wrapper.find('#body-highlight').attributes('fill')).toBe('#ABCDEF');
  });

  it('adds the float class when float is enabled and animations are on', () => {
    const wrapper = mount(TaskinBody, { props: { float: true } });
    expect(wrapper.find('#body-main').classes()).toContain('body-float');
  });

  it('skips animation classes when animations are disabled', () => {
    const wrapper = mount(TaskinBody, { props: { float: true, bounce: true, animationsEnabled: false } });
    expect(wrapper.find('#body-main').classes()).not.toContain('body-float');
    expect(wrapper.find('#body-main').classes()).not.toContain('body-bounce');
  });

  describe('variante sapin', () => {
    const mountSapin = (props: Record<string, unknown> = {}) =>
      mount(TaskinBody, { props: { variant: 'sapin', bodyColor: '#4DB848', ...props } });

    it('desenha coxas, corpo, calombos dos olhos, barriga e seis dedos', () => {
      const wrapper = mountSapin();

      expect(wrapper.find('g#body').attributes('data-variant')).toBe('sapin');
      expect(wrapper.findAll('#body-legs > path:not(.leg-shade)')).toHaveLength(2);
      expect(wrapper.find('#body-main').attributes('fill')).toBe('#4DB848');
      expect(wrapper.findAll('#body-eye-bumps circle')).toHaveLength(2);
      expect(wrapper.find('#body-belly').exists()).toBe(true);
      expect(wrapper.findAll('#body-toes .toe')).toHaveLength(6);
      expect(wrapper.find('#body-highlight').exists()).toBe(false);
    });

    it('poe os calombos em volta dos olhos do sapin', () => {
      const bumps = mountSapin().findAll('#body-eye-bumps circle');

      expect(bumps[0]?.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.left.x));
      expect(bumps[1]?.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.right.x));
    });

    it('pinta coxas, calombos e dedos com a cor do corpo, e clareia a barriga por cima dela', () => {
      const wrapper = mountSapin({ bodyColor: '#FFD700' });

      expect(wrapper.find('#body-legs > path:not(.leg-shade)').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-eye-bumps circle').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-toes .toe').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-belly').attributes('fill')).toBe('#fff');
    });

    it('bate os dedos quando pedido, e so com animacao ligada', () => {
      expect(mountSapin({ tapToes: true }).find('#body-toes').classes()).toContain('toes-tap');
      expect(mountSapin({ tapToes: true, animationsEnabled: false }).find('#body-toes').classes()).not.toContain(
        'toes-tap',
      );
    });

    it('move o sapo inteiro nas animacoes do corpo', () => {
      expect(mountSapin({ float: true }).find('#body-sapin').classes()).toContain('body-float');
    });
  });
});
