import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEyes from './TaskinEyes.vue';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

describe('TaskinEyes', () => {
  it('renders left and right eyes', () => {
    const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none' } });
    expect(wrapper.find('g#eyes').exists()).toBe(true);
    expect(wrapper.find('#left-eye').exists()).toBe(true);
    expect(wrapper.find('#right-eye').exists()).toBe(true);
  });

  it('renders normal sized pupils by default', () => {
    const wrapper = mount(TaskinEyes, { props: { trackingMode: 'none' } });
    const pupil = wrapper.find('#left-eye circle');
    expect(pupil.attributes('r')).toBe('5');
  });

  it('shrinks the eye height when closed', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'closed', trackingMode: 'none' } });
    const ellipse = wrapper.find('#left-eye ellipse');
    expect(Number(ellipse.attributes('ry'))).toBeLessThan(10);
  });

  it('enlarges the eye height when wide', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'wide', trackingMode: 'none' } });
    const ellipse = wrapper.find('#left-eye ellipse');
    expect(Number(ellipse.attributes('ry'))).toBeGreaterThan(14);
  });

  it('hides pupils when closed', () => {
    const wrapper = mount(TaskinEyes, { props: { state: 'closed', trackingMode: 'none' } });
    const pupil = wrapper.find('#left-eye circle');
    expect(pupil.attributes('r')).toBe('0');
  });

  it('moves pupils with the look direction', () => {
    const left = mount(TaskinEyes, { props: { trackingMode: 'none', lookDirection: 'left' } });
    const right = mount(TaskinEyes, { props: { trackingMode: 'none', lookDirection: 'right' } });
    expect(left.find('#left-eye circle').attributes('cx')).not.toBe(right.find('#left-eye circle').attributes('cx'));
  });
});
