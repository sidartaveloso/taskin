import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConnectionStatus from './ConnectionStatus.vue';

describe('ConnectionStatus', () => {
  it('renders the status text', () => {
    const wrapper = mount(ConnectionStatus, { props: { status: 'connected', statusText: 'Connected' } });
    expect(wrapper.find('.status-text').text()).toBe('Connected');
  });

  it('applies the status class to the indicator', () => {
    const wrapper = mount(ConnectionStatus, { props: { status: 'error' } });
    expect(wrapper.find('.status-indicator').classes()).toContain('status-indicator--error');
  });

  it('announces changes to assistive technology', () => {
    const wrapper = mount(ConnectionStatus, { props: { status: 'connecting' } });
    expect(wrapper.find('.connection-status').attributes('role')).toBe('status');
  });

  it('hides the retry button by default', () => {
    const wrapper = mount(ConnectionStatus);
    expect(wrapper.find('.retry-button').exists()).toBe(false);
  });

  it('emits retry when the retry button is clicked', async () => {
    const wrapper = mount(ConnectionStatus, { props: { showRetry: true } });
    await wrapper.find('.retry-button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('disables the retry button while retrying, and says so', () => {
    const wrapper = mount(ConnectionStatus, { props: { showRetry: true, isRetrying: true } });
    const botao = wrapper.find('.retry-button');
    expect(botao.attributes('disabled')).toBeDefined();
    expect(botao.text()).toBe('Reconectando...');
  });
});
