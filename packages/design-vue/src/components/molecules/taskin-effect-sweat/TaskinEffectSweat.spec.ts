import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectSweat from './TaskinEffectSweat';

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
});
