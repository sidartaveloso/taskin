import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import type { PrioritizationAction, WizardState } from '../../../composables/use-gesture-shortcuts';
import GestureWizard from './GestureWizard.vue';

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
  title: 'Molecules/Sense/GestureWizard',
  component: GestureWizard,
  tags: ['autodocs', 'ui-sense'],
  parameters: {
    docs: {
      description: {
        component: [
          '## The "Shortcut preferences" for gestures',
          '',
          '`GestureWizard` is the visual interface that lets a person **decide how they want to interact** — no developer needed, no config file to edit, no need to know what "gesture" means.',
          '',
          '### The full experience',
          '',
          '1. Person opens their hand 🖐️ for 2s → a progress bar appears',
          '2. Holds it for 5s → the wizard opens',
          '3. Makes a gesture and holds it for 2s → the gesture is captured',
          '4. Navigates with 👍/👎 and selects with ✊ → the action is chosen',
          '5. Confirma com ✊ → mapping salvo no `localStorage`',
          '6. ✨ Feedback visual → wizard fecha',
          '',
          '### Design principles',
          '',
          '- **Time based**: every transition requires holding the gesture, which keeps it from firing by accident',
          '- **Cancellable**: lowering your hand or making `Open_Palm` cancels at any point',
          '- **Persistent**: mappings are saved per `userId`, so each person keeps their own gestures',
          '- **Unobtrusive**: the overlay only renders while `wizardState !== "IDLE"`',
          '',
          'Veja a story de cada estado abaixo para entender o fluxo visual.',
        ].join('\n'),
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Default state. The overlay tells the person to hold an open hand 🖐️ for 2s to start setup. Nothing can fire by accident here — the wizard only advances while the gesture is held.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Open hand held for more than 2s. A progress bar counts up to 5s. Lowering the hand early returns to IDLE; completing the 5s advances to RECORDING. Making a different gesture instead of waiting jumps straight to RECORDING with that gesture as the candidate.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Step 1: make a gesture and hold it for 2s. While it is held, the preview shows which gesture is being detected. Releasing early restarts the timer — a gesture is only accepted after a full hold.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Step 2: browse the available actions with 👍 (next) and 👎 (previous), and confirm with ✊. The legend at the bottom lists the commands. `Open_Palm` 🖐️ cancels and returns to IDLE.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Step 3 — the review screen. The gesture-to-action pair is shown for confirmation: ✊ confirms and saves to `localStorage`, 🖐️ or 👎 cancels back to IDLE. This is the last barrier against setting something up by accident.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Success feedback with an ✨ animation. The mapping is already persisted in `localStorage`. After 1.5s the wizard returns to IDLE on its own and the overlay disappears. The new gesture shortcut is live.',
      },
    },
  },
};
