import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DashboardHeader from './DashboardHeader.vue';

const meta: Meta<typeof DashboardHeader> = {
  title: 'Organisms/DashboardHeader',
  component: DashboardHeader,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dashboard title',
    },
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'connecting', 'error'],
      description: 'Connection status',
    },
    statusText: {
      control: 'text',
      description: 'Status text displayed next to indicator',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display in banner',
    },
    showRetry: {
      control: 'boolean',
      description: 'Show retry button',
    },
    isRetrying: {
      control: 'boolean',
      description: 'Retry in progress state',
    },
    retryText: {
      control: 'text',
      description: 'Retry button text',
    },
    retryingText: {
      control: 'text',
      description: 'Retry button text when retrying',
    },
  },
  args: {
    title: 'Taskin Dashboard',
    status: 'connected',
    statusText: 'Connected',
    showRetry: false,
    isRetrying: false,
    retryText: 'Tentar novamente',
    retryingText: 'Reconectando...',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  args: {
    status: 'connected',
    statusText: 'Connected',
  },
};

export const Disconnected: Story = {
  args: {
    status: 'disconnected',
    statusText: 'Desconectado',
    showRetry: true,
  },
};

export const Connecting: Story = {
  args: {
    status: 'connecting',
    statusText: 'Connecting...',
  },
};

export const WithError: Story = {
  args: {
    status: 'error',
    statusText: 'Connection error',
    errorMessage: 'Could not connect to the WebSocket server',
    showRetry: true,
  },
};

export const Retrying: Story = {
  args: {
    status: 'error',
    statusText: 'Connection error',
    errorMessage: 'Tentando reconectar...',
    showRetry: true,
    isRetrying: true,
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Meu Dashboard Personalizado',
    status: 'connected',
    statusText: 'Online',
  },
};
