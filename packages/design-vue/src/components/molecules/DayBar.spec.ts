import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DayBar from './DayBar.vue';

describe('DayBar', () => {
  it('renders the hours label', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 6 } } });
    expect(wrapper.find('.day-bar__hours').text()).toBe('6h');
  });

  it('renders the progress fill width based on hours/maxHours', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 4 }, maxHours: 8 } });
    expect(wrapper.find('.day-bar__fill').attributes('style')).toContain('width: 50%');
  });

  it('caps the fill at 100%', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 20 }, maxHours: 8 } });
    expect(wrapper.find('.day-bar__fill').attributes('style')).toContain('width: 100%');
  });

  it('marks the success variant when hours reach the maximum', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 8 }, maxHours: 8 } });
    expect(wrapper.find('.day-bar__fill').classes()).toContain('day-bar__fill--success');
  });

  it('marks the danger variant for low hours', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 1 }, maxHours: 8 } });
    expect(wrapper.find('.day-bar__fill').classes()).toContain('day-bar__fill--danger');
  });

  it('shows the description in the default variant', () => {
    const wrapper = mount(DayBar, {
      props: { day: { date: new Date(), hours: 3, description: 'Deep work' } },
    });
    expect(wrapper.text()).toContain('Deep work');
  });

  it('hides the description in the compact variant', () => {
    const wrapper = mount(DayBar, {
      props: { day: { date: new Date(), hours: 3, description: 'Deep work' }, variant: 'compact' },
    });
    expect(wrapper.text()).not.toContain('Deep work');
  });

  it('renders "Hoje" for today', () => {
    const wrapper = mount(DayBar, { props: { day: { date: new Date(), hours: 1 } } });
    expect(wrapper.find('.day-bar__date').text()).toBe('Hoje');
  });
});
