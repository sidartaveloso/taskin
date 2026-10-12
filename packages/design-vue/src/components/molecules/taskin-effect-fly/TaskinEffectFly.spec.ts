import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectFly from './TaskinEffectFly';

describe('TaskinEffectFly', () => {
  it('desenha a mosca: um corpinho escuro e duas asas', () => {
    const wrapper = mount(TaskinEffectFly);
    expect(wrapper.find('g#effect-fly').exists()).toBe(true);
    expect(wrapper.findAll('.fly-body')).toHaveLength(1);
    expect(wrapper.findAll('.fly-wing')).toHaveLength(2);
  });

  it('voa e bate as asas com as animacoes ligadas', () => {
    const wrapper = mount(TaskinEffectFly);
    expect(wrapper.find('g#effect-fly').classes()).toContain('fly-catch');
    expect(wrapper.find('.fly-wing').classes()).toContain('fly-flap');
  });

  it('fica parada na frente da boca com as animacoes desligadas', () => {
    const wrapper = mount(TaskinEffectFly, { props: { animationsEnabled: false } });
    expect(wrapper.find('g#effect-fly').classes()).not.toContain('fly-catch');
    expect(wrapper.find('.fly-wing').classes()).not.toContain('fly-flap');
  });
});
