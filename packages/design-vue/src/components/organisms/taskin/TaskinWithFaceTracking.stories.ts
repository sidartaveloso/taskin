import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import TaskinWithFaceTracking from './TaskinWithFaceTracking.vue';

function getWebcam(canvasElement: HTMLElement): HTMLVideoElement | null {
  return canvasElement.querySelector('video.webcam-video');
}

const meta = {
  title: 'Organisms/Taskin/Face Tracking',
  component: TaskinWithFaceTracking,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Taskin with Face Detection (MediaPipe)

This component integrates the **MediaPipe Face Landmarker** to detect facial expressions in real time
via webcam e reproduzir no mascote Taskin.

## Funcionalidades

- **Eye sync**: Taskin's eyes follow where you look
- **Mouth sync**: Taskin's mouth opens as you open yours
- **Expression sync**: Taskin's mood changes with your expressions — smiling, frowning and so on

## Tecnologias

- **MediaPipe Face Landmarker**: Detecta 478 pontos faciais e 52 blendshapes
- **WebRTC**: Access to the webcam
- **Vue 3 Composition API**: Gerenciamento reativo do estado

## Requisitos

- Navegador moderno com suporte a WebRTC
- Permission to use the webcam
- An internet connection, to download the MediaPipe model

## Como Usar

1. Click "Start Detection"
2. Allow webcam access when asked
3. Move your eyes, smile, open your mouth — watch Taskin copy you
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
      description: 'Show blendshape debug information',
    },
  },
  args: {
    mascotSize: 300,
    showWebcam: false,
    showDebug: false,
  },
} satisfies Meta<typeof TaskinWithFaceTracking>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic example of Taskin with face detection.
 * Click "Start Detection" and allow webcam access.
 */
export const Default: Story = {
  args: {
    mascotSize: 300,
    showWebcam: false,
    showDebug: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.mascot-container')).not.toBeNull();
    expect(canvasElement.querySelector('g#body')).not.toBeNull();
    const video = getWebcam(canvasElement);
    expect(video).not.toBeNull();
    expect(video?.classList.contains('visible')).toBe(false);
  },
};

/**
 * Shows the webcam next to Taskin so you can compare them in real time.
 */
export const WithWebcamVisible: Story = {
  args: {
    mascotSize: 300,
    showWebcam: true,
    showDebug: false,
  },
  play: async ({ canvasElement }) => {
    const video = getWebcam(canvasElement);
    expect(video).not.toBeNull();
    expect(video?.classList.contains('visible')).toBe(true);
  },
};

/**
 * Modo debug que mostra os valores dos blendshapes detectados.
 * Useful for understanding how the detection behaves.
 */
export const DebugMode: Story = {
  args: {
    mascotSize: 250,
    showWebcam: true,
    showDebug: true,
  },
  play: async ({ canvasElement }) => {
    expect(getWebcam(canvasElement)?.classList.contains('visible')).toBe(true);
    const buttons = canvasElement.querySelectorAll('button.control-button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]?.textContent).toContain('Start');
  },
};

/**
 * Taskin at a large size, so the expressions are easier to read.
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
    expect(svg?.getAttribute('width')).toBe('400');
  },
};
