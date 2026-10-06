import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { SAPIN_CHARACTER } from '../../organisms/taskin/characters/sapin/sapin-character';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';
import TaskinEffectSweat from './TaskinEffectSweat';

const CHARACTERS = { taskin: TASKIN_CHARACTER, sapin: SAPIN_CHARACTER } as const;

describe('TaskinEffectSweat', () => {
  it('desenha tres gotas', () => {
    const wrapper = mount(TaskinEffectSweat);
    expect(wrapper.find('g#effect-sweat').exists()).toBe(true);
    expect(wrapper.findAll('.sweat-drop')).toHaveLength(3);
  });

  it('pinga com animacao ligada, e fica parada com ela desligada', () => {
    expect(mount(TaskinEffectSweat).find('.sweat-drop').attributes('style')).toContain('animation');
    expect(
      mount(TaskinEffectSweat, { props: { animationsEnabled: false } })
        .find('.sweat-drop')
        .attributes('style') ?? '',
    ).not.toContain('animation');
  });

  it('fica fora da cabeca do taskin, e anda com o rosto do sapin', () => {
    const posicao = (variant: 'taskin' | 'sapin') =>
      mount(TaskinEffectSweat, { props: { character: CHARACTERS[variant] } })
        .findAll('#effect-sweat > g')
        .map((gota) => gota.attributes('transform'));

    expect(posicao('taskin')).toEqual([
      'translate(106 62) scale(1)',
      'translate(214 60) scale(1)',
      'translate(224 84) scale(0.75)',
    ]);
    // Os olhos do Sapin estao 14 para fora e 19 acima dos do Taskin.
    expect(posicao('sapin')).toEqual([
      'translate(92 43) scale(1)',
      'translate(228 41) scale(1)',
      'translate(238 65) scale(0.75)',
    ]);
  });
});
