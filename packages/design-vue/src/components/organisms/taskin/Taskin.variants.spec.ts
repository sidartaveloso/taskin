import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Taskin from './Taskin';
import { TASKIN_MOODS } from './Taskin.moods';
import { TASKIN_VARIANTS, type TaskinVariant } from './Taskin.variants';

describe('TASKIN_VARIANTS', () => {
  it('nao repete variante', () => {
    expect(new Set(TASKIN_VARIANTS).size).toBe(TASKIN_VARIANTS.length);
  });

  it('comeca pelo taskin, que e o default do componente', () => {
    expect(TASKIN_VARIANTS[0]).toBe('taskin');
    expect(
      mount(Taskin, { props: { idleAnimation: false } })
        .find('g#body')
        .attributes('data-variant'),
    ).toBe('taskin');
  });

  it('e a fonte do tipo, e nao uma copia dele', () => {
    // Se a lista deixar de derivar o tipo, uma das duas atribuicoes para de
    // compilar — e o typecheck e quem cobra.
    const doTipo: TaskinVariant = 'sapin';
    const daLista: (typeof TASKIN_VARIANTS)[number] = doTipo;
    expect(daLista).toBe('sapin');
  });

  describe.each(TASKIN_VARIANTS)('a variante %s', (variant) => {
    it.each(TASKIN_MOODS)('aceita o humor %s e desenha corpo, olhos e boca', (mood) => {
      const wrapper = mount(Taskin, { props: { idleAnimation: false, variant, mood } });

      expect(wrapper.find('g#body').attributes('data-variant')).toBe(variant);
      expect(wrapper.find('g#eyes').exists()).toBe(true);
      expect(wrapper.find('#mouth').exists()).toBe(true);
    });
  });
});
