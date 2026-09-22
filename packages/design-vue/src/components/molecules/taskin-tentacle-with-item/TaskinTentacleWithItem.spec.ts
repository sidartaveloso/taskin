import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinTentacleWithItem from './TaskinTentacleWithItem.vue';

describe('TaskinTentacleWithItem', () => {
  it('renders the tentacle with item group', () => {
    const wrapper = mount(TaskinTentacleWithItem);
    expect(wrapper.find('g#tentacle-with-item').exists()).toBe(true);
  });

  it('applies the translate and rotate transform', () => {
    const wrapper = mount(TaskinTentacleWithItem, {
      props: { translateX: 5, translateY: 6, rotation: 45 },
    });
    const transform = wrapper.find('g#tentacle-with-item').attributes('transform');
    expect(transform).toContain('translate(5, 6)');
    expect(transform).toContain('rotate(45, 0, 0)');
  });

  it('renders a tentacle path inside', () => {
    const wrapper = mount(TaskinTentacleWithItem);
    expect(wrapper.find('g#tentacle-with-item path').exists()).toBe(true);
  });

  it('renders custom slot content as the tentacle tip', () => {
    const wrapper = mount(TaskinTentacleWithItem, {
      slots: { item: '<circle id="custom-item" />' },
    });
    expect(wrapper.find('#custom-item').exists()).toBe(true);
  });
});
