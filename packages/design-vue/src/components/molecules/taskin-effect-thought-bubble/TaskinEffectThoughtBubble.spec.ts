import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectThoughtBubble from './TaskinEffectThoughtBubble';

describe('TaskinEffectThoughtBubble', () => {
  it('renders the thought bubble with the given text', () => {
    const wrapper = mount(TaskinEffectThoughtBubble, { props: { text: 'Hmm' } });
    expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(true);
    expect(wrapper.find('text').text()).toBe('Hmm');
  });

  it('defaults to a question mark', () => {
    const wrapper = mount(TaskinEffectThoughtBubble);
    expect(wrapper.find('text').text()).toBe('?');
  });
});
