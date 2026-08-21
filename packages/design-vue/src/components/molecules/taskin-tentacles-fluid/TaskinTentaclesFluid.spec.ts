import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinTentaclesFluid from './TaskinTentaclesFluid';

describe('TaskinTentaclesFluid', () => {
  it('renders the requested number of tentacles', () => {
    const wrapper = mount(TaskinTentaclesFluid, { props: { count: 3 } });
    expect(wrapper.findAll('g.tentacle-tip')).toHaveLength(3);
  });

  it('renders four tentacles by default', () => {
    const wrapper = mount(TaskinTentaclesFluid);
    expect(wrapper.findAll('g.tentacle-tip')).toHaveLength(4);
  });

  it('applies the color to the tentacles', () => {
    const wrapper = mount(TaskinTentaclesFluid, { props: { color: '#00FF00' } });
    expect(wrapper.find('path').attributes('stroke')).toBe('#00FF00');
  });
});
