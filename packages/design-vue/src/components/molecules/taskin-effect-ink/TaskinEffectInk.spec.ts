import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectInk, { INK_ORIGIN } from './TaskinEffectInk';

describe('TaskinEffectInk', () => {
  it('desenha uma nuvem escura de varias bolhas', () => {
    const wrapper = mount(TaskinEffectInk);
    expect(wrapper.find('g#effect-ink').exists()).toBe(true);
    const puffs = wrapper.findAll('circle.ink-puff');
    expect(puffs.length).toBeGreaterThanOrEqual(5);
  });

  it('sai de baixo, entre os tentaculos', () => {
    const wrapper = mount(TaskinEffectInk);
    const ys = wrapper.findAll('circle.ink-puff').map((c) => Number(c.attributes('cy')));
    expect(INK_ORIGIN.y).toBeGreaterThan(190);
    for (const y of ys) expect(y).toBeGreaterThan(170);
  });

  it('cresce e se desfaz so com animacao ligada', () => {
    expect(mount(TaskinEffectInk).find('style').text()).toContain('ink-burst 1.6s');
    const still = mount(TaskinEffectInk, { props: { animationsEnabled: false } });
    expect(still.find('style').text()).toContain('animation: none');
  });
});
