import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectJuggle, { JUGGLE_PEAK } from './TaskinEffectJuggle';

describe('TaskinEffectJuggle', () => {
  it.each([1, 2, 3] as const)('desenha %i bolinha(s)', (balls) => {
    const wrapper = mount(TaskinEffectJuggle, { props: { balls } });
    expect(wrapper.find('g#effect-juggle').exists()).toBe(true);
    expect(wrapper.findAll('circle')).toHaveLength(balls);
  });

  it('nao desenha nada com 0', () => {
    const wrapper = mount(TaskinEffectJuggle, { props: { balls: 0 } });
    expect(wrapper.find('g#effect-juggle').exists()).toBe(false);
  });

  it('as bolinhas andam no arco, defasadas entre si', () => {
    const wrapper = mount(TaskinEffectJuggle, { props: { balls: 3 } });
    const motions = wrapper.findAll('animateMotion');
    expect(motions).toHaveLength(3);
    expect(new Set(motions.map((m) => m.attributes('begin'))).size).toBe(3);
  });

  it('sem animacao, as bolinhas ficam paradas no alto do arco', () => {
    const wrapper = mount(TaskinEffectJuggle, { props: { balls: 3, animationsEnabled: false } });
    expect(wrapper.findAll('animateMotion')).toHaveLength(0);
    for (const ball of wrapper.findAll('circle')) {
      expect(Math.abs(Number(ball.attributes('cy')) - JUGGLE_PEAK.y)).toBeLessThan(15);
    }
    const middle = wrapper.findAll('circle').at(1);
    expect(Number(middle?.attributes('cx'))).toBe(JUGGLE_PEAK.x);
  });
});
