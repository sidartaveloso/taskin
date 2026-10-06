import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';
import TaskinEffectWeight from './TaskinEffectWeight';

const CHARACTERS = { taskin: TASKIN_CHARACTER } as const;
type CharacterId = keyof typeof CHARACTERS;
const CHARACTER_IDS = ['taskin'] as const satisfies readonly CharacterId[];
const WEIGHT_HANDS = { taskin: TASKIN_CHARACTER.effortHands } as const;

describe('TaskinEffectWeight', () => {
  it.each(CHARACTER_IDS)('%s: renders a bar with a disc at each end', (variant) => {
    const wrapper = mount(TaskinEffectWeight, { props: { character: CHARACTERS[variant] } });
    const bar = wrapper.find('line.weight-bar');
    const discs = wrapper.findAll('rect.weight-disc');

    expect(wrapper.find('g#effect-weight').exists()).toBe(true);
    expect(discs).toHaveLength(2);
    const { left, right } = WEIGHT_HANDS[variant];
    expect([bar.attributes('x1'), bar.attributes('x2')]).toEqual([String(left.x), String(right.x)]);
    const centers = discs.map((d) => Number(d.attributes('x')) + Number(d.attributes('width')) / 2);
    expect(centers).toEqual([left.x, right.x]);
  });

  it('strains only while animations are enabled', () => {
    expect(mount(TaskinEffectWeight).find('style').text()).toContain('weight-strain 0.25s');
    const still = mount(TaskinEffectWeight, { props: { animationsEnabled: false } });
    expect(still.find('style').text()).toContain('animation: none');
  });
});
