import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinTentacle from './TaskinTentacle';

describe('TaskinTentacle', () => {
  it('renders a tentacle path', () => {
    const wrapper = mount(TaskinTentacle);
    expect(wrapper.find('path').exists()).toBe(true);
  });

  it('applies the color as stroke', () => {
    const wrapper = mount(TaskinTentacle, { props: { color: '#FF0000' } });
    expect(wrapper.find('path').attributes('stroke')).toBe('#FF0000');
  });

  it('applies the translate transform', () => {
    const wrapper = mount(TaskinTentacle, { props: { x: 12, y: 34 } });
    expect(wrapper.find('g').attributes('transform')).toContain('translate(12, 34)');
  });

  it('adds the wiggle class when enabled', () => {
    const wrapper = mount(TaskinTentacle, { props: { wiggle: true } });
    expect(wrapper.find('g').classes()).toContain('tentacle-wiggle');
  });

  it('renders slot content in the tentacle tip', () => {
    const wrapper = mount(TaskinTentacle, { slots: { tip: '<circle id="tip-dot" />' } });
    expect(wrapper.find('#tip-dot').exists()).toBe(true);
  });
});
