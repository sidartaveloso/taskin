import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import TaskinWithFullTracking from './TaskinWithFullTracking.vue';

function getWebcam(canvasElement: HTMLElement): HTMLVideoElement | null {
  return canvasElement.querySelector('video.webcam-video');
}

const meta = {
  title: 'Organisms/Taskin/Full Tracking',
  component: TaskinWithFullTracking,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Taskin with Face and Body Detection (MediaPipe)

Este componente integra **MediaPipe Face Landmarker** e **MediaPipe Pose Landmarker** para detectar
facial expressions and body posture in real time over the webcam, and mirror them on the Taskin mascot.

## Funcionalidades

- **Eye sync**: Taskin's eyes follow where you look and blink when you blink
- **Mouth sync**: Taskin's mouth opens and smiles as yours does
- **Arm sync**: Taskin's arms follow yours

## Tecnologias

- **MediaPipe Face Landmarker**: Detecta 478 pontos faciais e 52 blendshapes
- **MediaPipe Pose Landmarker**: Detecta 33 pontos corporais
- **WebRTC**: Access to the webcam
- **Vue 3 Composition API**: Gerenciamento reativo do estado

## Requisitos

- Navegador moderno com suporte a WebRTC
- Permission to use the webcam
- An internet connection, to download the MediaPipe models

## Como Usar

1. Click "Start Detection"
2. Allow webcam access when asked
3. Move your eyes, smile, open your mouth, raise your arms — watch Taskin copy all of it
4. Use the checkboxes to turn each kind of sync on and off

## Performance

MediaPipe runs locally in the browser on WebAssembly, using the GPU when available,
which keeps latency low and the data private — nothing is sent to a server.
        `,
      },
    },
  },
  tags: ['autodocs', 'design-vue', 'webcam'],
  argTypes: {
    mascotSize: {
      control: { type: 'number', min: 100, max: 500, step: 10 },
      description: 'Tamanho do mascote Taskin',
    },
    showWebcam: {
      control: 'boolean',
      description: 'Mostrar feed da webcam',
    },
    showDebug: {
      control: 'boolean',
      description: 'Show debug information',
    },
  },
  args: {
    mascotSize: 320,
    showWebcam: false,
    showDebug: false,
  },
} satisfies Meta<typeof TaskinWithFullTracking>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full example of Taskin with face and body detection.
 * Click "Start Detection" and allow webcam access.
 */
export const Default: Story = {
  args: {
    mascotSize: 320,
    showWebcam: false,
    showDebug: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.taskin-full-tracking')).not.toBeNull();
    expect(canvasElement.querySelector('g#body')).not.toBeNull();
    expect(getWebcam(canvasElement)?.classList.contains('visible')).toBe(false);
  },
};

/**
 * Shows the webcam next to Taskin so you can compare them in real time.
 */
export const WithWebcamVisible: Story = {
  args: {
    mascotSize: 320,
    showWebcam: true,
    showDebug: false,
  },
  play: async ({ canvasElement }) => {
    expect(getWebcam(canvasElement)?.classList.contains('visible')).toBe(true);
  },
};

/**
 * Modo debug que mostra os valores detectados.
 * Useful for understanding how the detection behaves.
 */
export const DebugMode: Story = {
  args: {
    mascotSize: 280,
    showWebcam: true,
    showDebug: true,
  },
  play: async ({ canvasElement }) => {
    expect(getWebcam(canvasElement)?.classList.contains('visible')).toBe(true);
    const button = canvasElement.querySelector('button.control-button');
    expect(button?.textContent).toContain('Start');
  },
};

/**
 * Taskin at a large size, so the expressions and movements are easier to read.
 */
export const LargeMascot: Story = {
  args: {
    mascotSize: 400,
    showWebcam: true,
    showDebug: false,
  },
  play: async ({ canvasElement }) => {
    expect(getWebcam(canvasElement)?.classList.contains('visible')).toBe(true);
    const svg = canvasElement.querySelector('.mascot-container svg');
    expect(svg?.getAttribute('width')).toBe('800');
  },
};
