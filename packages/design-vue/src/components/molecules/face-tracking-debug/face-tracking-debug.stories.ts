import type { Meta, StoryObj } from '@storybook/vue3';
import FaceTrackingDebug from './face-tracking-debug.vue';

const meta = {
  title: 'Molecules/FaceTrackingDebug',
  component: FaceTrackingDebug,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Debug data to display',
    },
    title: {
      control: 'text',
      description: 'Title of the debug panel',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: 'Position of the debug panel',
    },
  },
} satisfies Meta<typeof FaceTrackingDebug>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockDebugData = {
  smile: '0.75',
  frown: '0.12',
  mouthOpen: '0.45',
  eyesWide: false,
  eyeLook: {
    x: '+0.123456789012345',
    y: '-0.098765432109876',
  },
  eyeOpenness: {
    left: '+0.8765432109',
    right: '+0.9012345678',
  },
};

export const Default: Story = {
  args: {
    data: mockDebugData,
    title: 'Debug Info',
    position: 'top-right',
  },
};

export const TopLeft: Story = {
  args: {
    data: mockDebugData,
    title: 'Face Tracking',
    position: 'top-left',
  },
};

export const BottomRight: Story = {
  args: {
    data: mockDebugData,
    title: 'BlendShapes',
    position: 'bottom-right',
  },
};

export const NoData: Story = {
  args: {
    data: null,
    title: 'Debug Info',
    position: 'top-right',
  },
};
