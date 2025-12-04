import type { Meta, StoryObj } from '@storybook/vue3';
import WebcamVideo from './webcam-video.vue';

const meta = {
  title: 'Atoms/WebcamVideo',
  component: WebcamVideo,
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Show or hide the webcam feed',
    },
    width: {
      control: { type: 'number', min: 160, max: 1280, step: 40 },
      description: 'Width of the webcam feed',
    },
    height: {
      control: { type: 'number', min: 120, max: 720, step: 30 },
      description: 'Height of the webcam feed',
    },
    mirrored: {
      control: 'boolean',
      description: 'Mirror the video (horizontal flip)',
    },
  },
} satisfies Meta<typeof WebcamVideo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    width: 320,
    height: 240,
    mirrored: true,
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    width: 320,
    height: 240,
    mirrored: true,
  },
};

export const NotMirrored: Story = {
  args: {
    visible: true,
    width: 320,
    height: 240,
    mirrored: false,
  },
};

export const Large: Story = {
  args: {
    visible: true,
    width: 640,
    height: 480,
    mirrored: true,
  },
};
