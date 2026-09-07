import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DashboardHeader from './DashboardHeader.vue';

describe('DashboardHeader', () => {
  it('renders the title', () => {
    const wrapper = mount(DashboardHeader, { props: { title: 'My Board' } });
    expect(wrapper.find('h1.header-title').text()).toBe('My Board');
  });

  it('renders the status text', () => {
    const wrapper = mount(DashboardHeader, { props: { status: 'connected', statusText: 'Connected' } });
    expect(wrapper.find('.status-text').text()).toBe('Connected');
  });

  it('applies the status class to the indicator', () => {
    const wrapper = mount(DashboardHeader, { props: { status: 'error' } });
    expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--error');
  });

  it('hides the retry button by default', () => {
    const wrapper = mount(DashboardHeader);
    expect(wrapper.find('.retry-button').exists()).toBe(false);
  });

  it('shows the retry button when showRetry is true', () => {
    const wrapper = mount(DashboardHeader, { props: { showRetry: true } });
    expect(wrapper.find('.retry-button').exists()).toBe(true);
  });

  it('emits retry when the retry button is clicked', async () => {
    const wrapper = mount(DashboardHeader, { props: { showRetry: true } });
    await wrapper.find('.retry-button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('disables the retry button while retrying', () => {
    const wrapper = mount(DashboardHeader, { props: { showRetry: true, isRetrying: true } });
    expect(wrapper.find('.retry-button').attributes('disabled')).toBeDefined();
  });

  it('renders the error banner when an error message is set', () => {
    const wrapper = mount(DashboardHeader, { props: { errorMessage: 'Connection lost' } });
    expect(wrapper.find('.error-banner').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toBe('Connection lost');
  });
});
