import type { Meta, StoryObj } from '@storybook/vue3';
import FaceTrackingControls from './face-tracking-controls.vue';

const meta = {
  title: 'Molecules/FaceTrackingControls',
  component: FaceTrackingControls,
  tags: ['autodocs'],
  argTypes: {
    isDetecting: {
      control: 'boolean',
      description: 'Whether face tracking is currently detecting',
    },
    error: {
      control: 'text',
      description: 'Error message from face tracking',
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
    disabled: {
      control: 'boolean',
      description: 'Disable start/stop button',
    },
  },
} satisfies Meta<typeof FaceTrackingControls>;

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
    disabled: false,
  },
};
