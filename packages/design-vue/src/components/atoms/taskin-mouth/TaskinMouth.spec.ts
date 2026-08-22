import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinMouth from './TaskinMouth.vue';

describe('TaskinMouth', () => {
  it('renders the mouth path', () => {
    const wrapper = mount(TaskinMouth);
    expect(wrapper.find('#mouth').exists()).toBe(true);
  });

  it('renders a different path per expression', () => {
    const neutral = mount(TaskinMouth, { props: { expression: 'neutral' } });
    const smile = mount(TaskinMouth, { props: { expression: 'smile' } });
    expect(neutral.find('#mouth').attributes('d')).not.toBe(smile.find('#mouth').attributes('d'));
  });

  it('fills the mouth for open expressions', () => {
    const openExpressions: Array<'open' | 'wide-open' | 'o-shape' | 'surprised'> = [
      'open',
      'wide-open',
      'o-shape',
      'surprised',
    ];
    for (const expression of openExpressions) {
      const wrapper = mount(TaskinMouth, { props: { expression } });
      expect(wrapper.find('#mouth').attributes('fill')).not.toBe('none');
    }
  });

  it('leaves neutral expressions unfilled', () => {
    const wrapper = mount(TaskinMouth, { props: { expression: 'neutral' } });
    expect(wrapper.find('#mouth').attributes('fill')).toBe('none');
  });
});
