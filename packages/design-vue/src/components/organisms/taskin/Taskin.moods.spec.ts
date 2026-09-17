import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Taskin from './Taskin';
import { TASKIN_MOODS } from './Taskin.moods';
import type { TaskinMood } from './Taskin.types';

describe('TASKIN_MOODS', () => {
  it('nao repete humor', () => {
    expect(new Set(TASKIN_MOODS).size).toBe(TASKIN_MOODS.length);
  });

  it('comeca pelo neutral, que e o default do componente', () => {
    expect(TASKIN_MOODS[0]).toBe('neutral');
  });

  it('e a fonte do tipo, e nao uma copia dele', () => {
    // Se a lista deixar de derivar o tipo, uma das duas atribuicoes para de
    // compilar — e o typecheck e quem cobra.
    const doTipo: TaskinMood = 'dancing';
    const daLista: (typeof TASKIN_MOODS)[number] = doTipo;
    expect(daLista).toBe('dancing');
  });

  it.each(TASKIN_MOODS)('o componente aceita o humor %s e desenha a boca', (mood) => {
    const wrapper = mount(Taskin, { props: { idleAnimation: false, mood } });

    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('#mouth').exists()).toBe(true);
  });
});
