import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GestureIcon from './GestureIcon.vue';

describe('GestureIcon', () => {
  it('renders the emoji for a canned gesture', () => {
    const wrapper = mount(GestureIcon, { props: { gesture: 'Thumb_Up' } });
    expect(wrapper.find('.gesture-icon__emoji').text()).toBe('👍');
  });

  it('renders the open palm emoji for Open_Palm', () => {
    const wrapper = mount(GestureIcon, { props: { gesture: 'Open_Palm' } });
    expect(wrapper.find('.gesture-icon__emoji').text()).toBe('🖐️');
  });

  it('normalizes snake-case gesture names', () => {
    const wrapper = mount(GestureIcon, { props: { gesture: 'closed_fist' } });
    expect(wrapper.find('.gesture-icon__emoji').text()).not.toBe('');
  });

  it('falls back to None for unknown gestures', () => {
    const unknown = mount(GestureIcon, { props: { gesture: 'klingon_salute' } });
    const none = mount(GestureIcon, { props: { gesture: 'None' } });
    expect(unknown.find('.gesture-icon__emoji').text()).toBe(none.find('.gesture-icon__emoji').text());
  });

  it('renders the label when showLabel is true', () => {
    const wrapper = mount(GestureIcon, { props: { gesture: 'Open_Palm', showLabel: true } });
    expect(wrapper.find('.gesture-icon__label').text()).toBe('Mão aberta');
  });

  it('applies the size class', () => {
    const wrapper = mount(GestureIcon, { props: { gesture: 'None', size: 'lg' } });
    expect(wrapper.find('.gesture-icon').classes()).toContain('gesture-icon--lg');
  });
});
