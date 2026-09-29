import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { EYE_GEOMETRY } from './TaskinEyes.types';
import TaskinEyes from './TaskinEyes.vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

describe('TaskinEyes', () => {
  it('renders left and right eyes', () => {
    const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none' } });
    expect(wrapper.find('g#eyes').exists()).toBe(true);
    expect(wrapper.find('#left-eye').exists()).toBe(true);
    expect(wrapper.find('#right-eye').exists()).toBe(true);
  });

  it('renders normal sized pupils by default', () => {
    const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none' } });
    const pupil = wrapper.find('#left-eye circle');
    expect(pupil.attributes('r')).toBe('5');
  });

  it('shrinks the eye height when closed', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'closed', trackingMode: 'none' } });
    const ellipse = wrapper.find('#left-eye ellipse');
    expect(Number(ellipse.attributes('ry'))).toBeLessThan(10);
  });

  it('enlarges the eye height when wide', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'wide', trackingMode: 'none' } });
    const ellipse = wrapper.find('#left-eye ellipse');
    expect(Number(ellipse.attributes('ry'))).toBeGreaterThan(14);
  });

  it('hides pupils when closed', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'closed', trackingMode: 'none' } });
    const pupil = wrapper.find('#left-eye circle');
    expect(pupil.attributes('r')).toBe('0');
  });

  it('moves pupils with the look direction', () => {
    const left = mount(TaskinEyes, { props: { trackingMode: 'none', lookDirection: 'left' } });
    const right = mount(TaskinEyes, { props: { trackingMode: 'none', lookDirection: 'right' } });
    expect(left.find('#left-eye circle').attributes('cx')).not.toBe(right.find('#left-eye circle').attributes('cx'));
  });

  describe('variante sapin', () => {
    it('poe os olhos no topo da cabeca, nos centros da geometria do sapin', () => {
      const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none', variant: 'sapin' } });
      const esquerdo = wrapper.find('#left-eye ellipse');
      const direito = wrapper.find('#right-eye ellipse');

      expect(esquerdo.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.left.x));
      expect(esquerdo.attributes('cy')).toBe(String(EYE_GEOMETRY.sapin.left.y));
      expect(direito.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.right.x));
      expect(wrapper.find('#left-eye circle').attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.left.x));
    });

    it('desenha a esclera redonda e sem contorno, como na referencia', () => {
      const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none', variant: 'sapin' } });
      const esclera = wrapper.find('#left-eye ellipse');

      expect(esclera.attributes('rx')).toBe(esclera.attributes('ry'));
      expect(esclera.attributes('stroke')).toBe('none');
      expect(wrapper.find('#left-eye circle').attributes('r')).toBe('6');
    });

    it('desenha a palpebra quando fechado, para o olho nao sumir no verde', () => {
      const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none', variant: 'sapin', state: 'closed' } });
      const esclera = wrapper.find('#left-eye ellipse');

      expect(esclera.attributes('stroke')).toBe('#2C3E50');
      expect(Number(esclera.attributes('ry'))).toBeLessThan(3);
      expect(wrapper.find('#left-eye circle').attributes('r')).toBe('0');
    });

    it('mantem o taskin como padrao, com contorno e nos centros de sempre', () => {
      const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none' } });
      const esclera = wrapper.find('#left-eye ellipse');

      expect(esclera.attributes('cx')).toBe('135');
      expect(esclera.attributes('cy')).toBe('90');
      expect(esclera.attributes('stroke')).toBe('#2C3E50');
    });
  });
});
