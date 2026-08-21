import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { defaultTaskinProps } from './Taskin.mock';
import TaskinWithShhh from './TaskinWithShhh.vue';

const meta = {
  title: 'Organisms/TaskinWithShhh',
  component: TaskinWithShhh,
  argTypes: {
    mascotSize: { control: { type: 'number' } },
    showWebcam: { control: { type: 'boolean' } },
    showDebug: { control: { type: 'boolean' } },
    enableNoiseReactions: { control: { type: 'boolean' } },
    noiseThreshold: { control: { type: 'number' } },
    noiseDebounceMs: { control: { type: 'number' } },
    noiseSound: { control: { type: 'boolean' } },
  },
  args: {
    mascotSize: 300,
    showWebcam: false,
    showDebug: false,
    enableNoiseReactions: false,
    noiseThreshold: 0.06,
    noiseDebounceMs: 1500,
    noiseSound: false,
    ...defaultTaskinProps,
  },
} satisfies Meta<typeof TaskinWithShhh>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { TaskinWithShhh },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem;">
        <TaskinWithShhh v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.mascot-container')).not.toBeNull();
    expect(canvasElement.querySelector('g#body')).not.toBeNull();
    expect(canvasElement.querySelector('video.webcam-video')?.classList.contains('visible')).toBe(false);
  },
};

export const WithWebcam: Story = {
  render: (args: any) => ({
    components: { TaskinWithShhh },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; display:flex; gap:16px;">
        <TaskinWithShhh v-bind="args" />
      </div>
    `,
  }),
  args: {
    showWebcam: true,
    showDebug: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('video.webcam-video')?.classList.contains('visible')).toBe(true);
    expect(canvasElement.querySelector('button.control-button')?.textContent).toContain('Iniciar');
  },
};

export const NoiseOnly: Story = {
  render: (args: any) => ({
    components: { TaskinWithShhh },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem;">
        <TaskinWithShhh v-bind="args" />
      </div>
    `,
  }),
  args: {
    showWebcam: false,
    showDebug: true,
    enableNoiseReactions: true,
    noiseThreshold: 0.05,
    noiseDebounceMs: 1000,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.mascot-container')).not.toBeNull();
    expect(canvasElement.querySelector('button.control-button')?.textContent).toContain('Iniciar');
  },
};
