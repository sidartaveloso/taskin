// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import TaskinWithFaceTracking from './taskin-with-face-tracking.vue';

const meta = {
  title: 'Organisms/Taskin/Face Tracking',
  component: TaskinWithFaceTracking,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Taskin com Detecção Facial (MediaPipe)

Este componente integra o **MediaPipe Face Landmarker** para detectar expressões faciais em tempo real
via webcam e reproduzir no mascote Taskin.

## Funcionalidades

- **Sincronização de Olhos**: Os olhos do Taskin seguem a direção do seu olhar
- **Sincronização de Boca**: A boca do Taskin abre conforme você abre a sua
- **Sincronização de Expressões**: O mood do Taskin muda baseado nas suas expressões (sorriso, franzir, etc)

## Tecnologias

- **MediaPipe Face Landmarker**: Detecta 478 pontos faciais e 52 blendshapes
- **WebRTC**: Acesso à webcam do usuário
- **Vue 3 Composition API**: Gerenciamento reativo do estado

## Requisitos

- Navegador moderno com suporte a WebRTC
- Permissão de acesso à webcam
- Conexão com internet (para carregar o modelo do MediaPipe)

## Como Usar

1. Clique em "Iniciar Detecção"
2. Permita o acesso à webcam quando solicitado
3. Mova os olhos, sorria, abra a boca - veja o Taskin copiar suas expressões!
4. Use os checkboxes para ativar/desativar cada tipo de sincronização

## Performance

O MediaPipe roda localmente no navegador usando WebAssembly e GPU quando disponível,
garantindo baixa latência e privacidade (nenhum dado é enviado para servidores).
        `,
      },
    },
  },
  tags: ['autodocs'],
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
      description: 'Mostrar informações de debug dos blendshapes',
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
 * Exemplo básico do Taskin com detecção facial.
 * Clique em "Iniciar Detecção" e permita o acesso à webcam.
 */
export const Default: Story = {
  args: {
    mascotSize: 300,
    showWebcam: false,
    showDebug: false,
  },
};

/**
 * Visualize a webcam junto com o Taskin para ver a correspondência em tempo real.
 */
export const WithWebcamVisible: Story = {
  args: {
    mascotSize: 300,
    showWebcam: true,
    showDebug: false,
  },
};

/**
 * Modo debug que mostra os valores dos blendshapes detectados.
 * Útil para entender como a detecção está funcionando.
 */
export const DebugMode: Story = {
  args: {
    mascotSize: 250,
    showWebcam: true,
    showDebug: true,
  },
};

/**
 * Taskin em tamanho grande para melhor visualização das expressões.
 */
export const LargeMascot: Story = {
  args: {
    mascotSize: 400,
    showWebcam: true,
    showDebug: false,
  },
};
