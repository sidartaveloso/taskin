import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Taskin from './Taskin';

function mountTaskin(overrides: Record<string, unknown> = {}) {
  return mount(Taskin, {
    props: { idleAnimation: false, ...overrides },
  });
}

describe('Taskin', () => {
  it('renders the mascot svg with the given size', () => {
    const wrapper = mountTaskin({ size: 200 });
    expect(wrapper.find('svg').attributes('width')).toBe('200');
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 320 260');
  });

  it('renders the body and arms', () => {
    const wrapper = mountTaskin();
    expect(wrapper.find('g#body').exists()).toBe(true);
    expect(wrapper.find('g#arms').exists()).toBe(true);
  });

  it('renders the eyes and mouth', () => {
    const wrapper = mountTaskin();
    expect(wrapper.find('g#eyes').exists()).toBe(true);
    expect(wrapper.find('#mouth').exists()).toBe(true);
  });

  it('renders tears when the mood is crying', () => {
    const wrapper = mountTaskin({ mood: 'crying' });
    expect(wrapper.find('g#effect-tears').exists()).toBe(true);
  });

  it('renders hearts when the mood is in-love', () => {
    const wrapper = mountTaskin({ mood: 'in-love' });
    expect(wrapper.find('g#effect-hearts').exists()).toBe(true);
  });

  it('renders the thought bubble when the mood is thoughtful', () => {
    const wrapper = mountTaskin({ mood: 'thoughtful' });
    expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(true);
  });

  it('renders the arms-with-phone for the taking-selfie mood', () => {
    const wrapper = mountTaskin({ mood: 'taking-selfie' });
    expect(wrapper.find('g#arm-with-item').exists()).toBe(true);
  });

  it('overrides the mouth expression when provided', () => {
    const wrapper = mountTaskin({ mouthExpression: 'smile' });
    const neutral = mountTaskin();
    expect(wrapper.find('#mouth').attributes('d')).not.toBe(neutral.find('#mouth').attributes('d'));
  });
});
