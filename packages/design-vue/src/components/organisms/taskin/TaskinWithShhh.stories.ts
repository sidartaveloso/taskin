import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { defaultTaskinProps } from './Taskin.mock';
import TaskinWithShhh from './TaskinWithShhh.vue';

const meta = {
  title: 'Organisms/Taskin/Shhh',
  component: TaskinWithShhh,
  tags: ['design-vue', 'webcam', 'microphone'],
  argTypes: {
    mascotSize: { control: { type: 'number' } },
    showWebcam: { control: { type: 'boolean' } },
    showDebug: { control: { type: 'boolean' } },
    enableNoiseReactions: { control: { type: 'boolean' } },
    noiseThreshold: { control: { type: 'number' } },
    noiseDebounceMs: { control: { type: 'number' } },
    noiseSound: { control: { type: 'boolean' } },
    shhhPhrase: { control: { type: 'text' } },
    shhhVolume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  args: {
    mascotSize: 300,
    showWebcam: false,
    showDebug: false,
    enableNoiseReactions: false,
    noiseThreshold: 0.06,
    noiseDebounceMs: 1500,
    noiseSound: false,
    shhhPhrase: 'Shhhhhh...',
    shhhVolume: 1,
    ...defaultTaskinProps,
  },
} satisfies Meta<typeof TaskinWithShhh>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: Story['args']) => ({
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
  render: (args: Story['args']) => ({
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
    expect(canvasElement.querySelector('button.control-button')?.textContent).toContain('Start');
  },
};

export const NoiseOnly: Story = {
  render: (args: Story['args']) => ({
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
    expect(canvasElement.querySelector('button.control-button')?.textContent).toContain('Start');
  },
};

export const BrunoShhh: Story = {
  render: (args: Story['args']) => ({
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
    noiseDebounceMs: 3000,
    noiseSound: true,
    shhhPhrase: 'Bruno, Shhhhhhhhhhhh...',
    shhhVolume: 1,
  },
  parameters: {
    docs: {
      description: {
        story: [
          'O caso de uso para o qual isto existe: o celular fica na mesa, tela ligada, virado para quem programa.',
          'Quando o nivel de ruido da sala passa do limiar, o Taskin fala em voz alta — pelo `speechSynthesis` do',
          'proprio navegador — e chia junto, com um ruido de banda alta sintetizado na hora. Ninguem precisa',
          'interromper o proprio trabalho para pedir silencio, e o pedido pode ter nome.',
          '',
          'Ligar `noiseSound` e o que faz sair som. O navegador so libera audio depois de um clique na pagina, entao',
          'interaja com a story uma vez antes de esperar a voz.',
        ].join(' '),
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.mascot-container')).not.toBeNull();
  },
};
