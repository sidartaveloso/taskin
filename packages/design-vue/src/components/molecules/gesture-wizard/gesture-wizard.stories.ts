import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import type {
  PrioritizationAction,
  WizardState,
} from '../../../composables/use-gesture-shortcuts';
import GestureWizard from './gesture-wizard.vue';

const AVAILABLE_ACTIONS: PrioritizationAction[] = [
  'moveUp',
  'moveDown',
  'groupWith',
  'ungroup',
  'undo',
  'copyCard',
  'none',
];

const meta = {
  title: 'Molecules/GestureWizard',
  component: GestureWizard,
  tags: ['autodocs'],
} satisfies Meta<typeof GestureWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('IDLE');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 0,
          step: 0,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
};

export const Ready: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('READY');
      const progress = ref(2500);
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: progress.value,
          step: 0,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
};

export const Recording: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('RECORDING');
      const candidate = ref<'Pointing_Up'>('Pointing_Up');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 1,
          recordingCandidate: candidate.value,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
};

export const Selecting: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('SELECTING');
      const idx = ref(2);
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 2,
          recordingCandidate: 'Pointing_Up',
          selectedActionIndex: idx.value,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
};

export const Confirming: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('CONFIRMING');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 3,
          recordingCandidate: 'Pointing_Up',
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
          lastMapping: { gesture: 'Pointing_Up', action: 'moveUp' },
        });
    },
  }),
};

export const Saved: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('SAVED');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 4,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
          lastMapping: { gesture: 'Pointing_Up', action: 'moveUp' },
        });
    },
  }),
};
