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
    noiseSustainMs: { control: { type: 'number' } },
    noiseSustainRatio: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 } },
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
    noiseSustainMs: 0,
    noiseSustainRatio: 0.6,
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
    // Tres segundos de janela com 60% dela acima do limiar antes do primeiro
    // pedido, e dez segundos de silencio do mascote antes do proximo. Uma porta
    // batendo ocupa 1 a 4% da janela; uma conversa alta ocupa 60 a 87%.
    noiseSustainMs: 3000,
    noiseSustainRatio: 0.6,
    noiseDebounceMs: 10000,
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
          'Os tempos respondem a perguntas diferentes, e aqui estao configurados para o caso real: `noiseSustainMs`',
          '(3000ms) e a janela em que o ruido e medido, `noiseSustainRatio` (60%) e quanto dela precisa estar acima',
          'do limiar, e `noiseDebounceMs` (10000ms) e quanto tempo o mascote fica calado depois de pedir, para nao',
          'virar ele proprio o barulho da sala.',
          '',
          'A fracao existe porque uma fala nao e um plato: entre silabas e frases ha vales de 100 a 400ms, e exigir',
          'barulho ininterrupto detecta um secador de cabelo mas nunca uma conversa. Numa janela de 3s, uma porta',
          'batendo ocupa 1 a 4% e uma conversa alta ocupa 60 a 87% — 60% cai no vao entre os dois. Com o `Ratio` em',
          '100% a exigencia volta a ser ininterrupta.',
          '',
          'O botao **Test Shhh** dispara a reacao como se o ruido tivesse sido detectado, sem passar pelo detector e',
          'mesmo com o microfone desligado: e assim que se ajusta frase, voz e volume sem gritar na sala.',
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
