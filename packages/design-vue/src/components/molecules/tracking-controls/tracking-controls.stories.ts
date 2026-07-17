import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TrackingControls from './tracking-controls.vue';

const meta = {
  title: 'Molecules/TrackingControls',
  component: TrackingControls,
  tags: ['autodocs'],
  argTypes: {
    isDetecting: {
      control: 'boolean',
      description: 'Whether tracking is currently detecting',
    },
    error: {
      control: 'text',
      description: 'Error message from tracking',
    },
    showWebcam: {
      control: 'boolean',
      description: 'Show webcam feed',
    },
    syncEyes: {
      control: 'boolean',
      description: 'Sync eyes with face tracking',
    },
    syncMouth: {
      control: 'boolean',
      description: 'Sync mouth with face tracking',
    },
    syncExpressions: {
      control: 'boolean',
      description: 'Sync expressions with face tracking',
    },
    syncArms: {
      control: 'boolean',
      description: 'Sync arms with pose tracking',
    },
    syncGestures: {
      control: 'boolean',
      description: 'Sync gesture recognition',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable start/stop button',
    },
  },
} satisfies Meta<typeof TrackingControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isDetecting: false,
    error: null,
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
};

export const Detecting: Story = {
  args: {
    isDetecting: true,
    error: null,
    showWebcam: true,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: true,
    syncGestures: true,
    disabled: false,
  },
};

export const WithError: Story = {
  args: {
    isDetecting: false,
    error: 'Falha ao acessar a webcam. Verifique as permissões.',
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: true,
  },
};

export const AllDisabled: Story = {
  args: {
    isDetecting: false,
    error: null,
    showWebcam: false,
    syncEyes: false,
    syncMouth: false,
    syncExpressions: false,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
};
