// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import TaskinWithFullTracking from './taskin-with-full-tracking.vue';

const meta = {
  title: 'Organisms/Taskin/Full Tracking',
  component: TaskinWithFullTracking,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Taskin com Detecção Facial e Corporal (MediaPipe)

Este componente integra **MediaPipe Face Landmarker** e **MediaPipe Pose Landmarker** para detectar
expressões faciais e postura corporal em tempo real via webcam e reproduzir no mascote Taskin.

## Funcionalidades

- **Sincronização de Olhos**: Os olhos do Taskin seguem a direção do seu olhar e piscam quando você pisca
- **Sincronização de Boca**: A boca do Taskin abre e sorri conforme você abre e sorri
- **Sincronização de Braços**: Os braços do Taskin se movem seguindo os seus braços

## Tecnologias

- **MediaPipe Face Landmarker**: Detecta 478 pontos faciais e 52 blendshapes
- **MediaPipe Pose Landmarker**: Detecta 33 pontos corporais
- **WebRTC**: Acesso à webcam do usuário
- **Vue 3 Composition API**: Gerenciamento reativo do estado

## Requisitos

- Navegador moderno com suporte a WebRTC
- Permissão de acesso à webcam
- Conexão com internet (para carregar os modelos do MediaPipe)

## Como Usar

1. Clique em "Iniciar Detecção"
2. Permita o acesso à webcam quando solicitado
3. Mova os olhos, sorria, abra a boca, levante os braços - veja o Taskin copiar tudo!
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
      description: 'Mostrar informações de debug',
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
 * Exemplo completo do Taskin com detecção facial e corporal.
 * Clique em "Iniciar Detecção" e permita o acesso à webcam.
 */
export const Default: Story = {
  args: {
    mascotSize: 320,
    showWebcam: false,
    showDebug: false,
  },
};

/**
 * Visualize a webcam junto com o Taskin para ver a correspondência em tempo real.
 */
export const WithWebcamVisible: Story = {
  args: {
    mascotSize: 320,
    showWebcam: true,
    showDebug: false,
  },
};

/**
 * Modo debug que mostra os valores detectados.
 * Útil para entender como a detecção está funcionando.
 */
export const DebugMode: Story = {
  args: {
    mascotSize: 280,
    showWebcam: true,
    showDebug: true,
  },
};

/**
 * Taskin em tamanho grande para melhor visualização das expressões e movimentos.
 */
export const LargeMascot: Story = {
  args: {
    mascotSize: 400,
    showWebcam: true,
    showDebug: false,
  },
};
