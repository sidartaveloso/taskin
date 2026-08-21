import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { GestureWizardProps } from './GestureWizard.types';
import GestureWizardCard from './GestureWizardCard.vue';

const baseProps: GestureWizardProps = {
  wizardState: 'IDLE',
  readyProgress: 0,
  step: 0,
  recordingCandidate: null,
  selectedActionIndex: 0,
  availableActions: ['moveUp'],
};

function mountCard(props: Partial<GestureWizardProps> = {}) {
  return mount(GestureWizardCard, { props: { ...baseProps, ...props } });
}

describe('GestureWizardCard', () => {
  it('renders four step dots', () => {
    const wrapper = mountCard();
    expect(wrapper.findAll('.step-dot')).toHaveLength(4);
  });

  it('renders the idle hint by default', () => {
    const wrapper = mountCard();
    expect(wrapper.text()).toContain('Mantenha a mão aberta');
  });

  it('renders the ready state with configuration mode', () => {
    const wrapper = mountCard({ wizardState: 'READY', readyProgress: 2500 });
    expect(wrapper.text()).toContain('Modo de configuração');
  });

  it('renders the saved confirmation', () => {
    const wrapper = mountCard({
      wizardState: 'SAVED',
      lastMapping: { gesture: 'Victory', action: 'groupWith' },
    });
    expect(wrapper.text()).toContain('Atalho salvo!');
  });

  it('renders the recording step with the candidate gesture', () => {
    const wrapper = mountCard({ wizardState: 'RECORDING', recordingCandidate: 'Open_Palm', step: 1 });
    expect(wrapper.find('.gesture-preview').exists()).toBe(true);
  });

  it('renders the error message when provided', () => {
    const wrapper = mountCard({ error: 'camera failed' });
    expect(wrapper.text()).toContain('camera failed');
  });
});
