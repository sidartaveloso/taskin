import type { Meta, StoryObj } from '@storybook/vue3';
import DashboardLayout from './DashboardLayout.vue';

const meta: Meta<typeof DashboardLayout> = {
  title: 'Templates/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dashboard title',
    },
    connectionStatus: {
      control: 'select',
      options: ['connected', 'disconnected', 'connecting', 'error'],
      description: 'Connection status',
    },
    statusText: {
      control: 'text',
      description: 'Status text',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message',
    },
    showRetry: {
      control: 'boolean',
      description: 'Show retry button',
    },
    isRetrying: {
      control: 'boolean',
      description: 'Retrying state',
    },
  },
  args: {
    title: 'Taskin Dashboard',
    connectionStatus: 'connected',
    statusText: 'Conectado',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { DashboardLayout },
    setup() {
      return { args };
    },
    template: `
      <DashboardLayout v-bind="args">
        <div style="padding: 2rem; text-align: center;">
          <h2>Dashboard Content</h2>
          <p>This is where the main content goes.</p>
        </div>
      </DashboardLayout>
    `,
  }),
};

export const WithError: Story = {
  args: {
    connectionStatus: 'error',
    statusText: 'Erro de conexão',
    errorMessage: 'Não foi possível conectar ao servidor WebSocket',
    showRetry: true,
  },
  render: (args) => ({
    components: { DashboardLayout },
    setup() {
      return { args };
    },
    template: `
      <DashboardLayout v-bind="args">
        <div style="padding: 2rem; text-align: center; color: #999;">
          <p>Content appears when connected...</p>
        </div>
      </DashboardLayout>
    `,
  }),
};

export const Connecting: Story = {
  args: {
    connectionStatus: 'connecting',
    statusText: 'Conectando...',
  },
  render: (args) => ({
    components: { DashboardLayout },
    setup() {
      return { args };
    },
    template: `
      <DashboardLayout v-bind="args">
        <div style="padding: 4rem; text-align: center;">
          <div style="width: 48px; height: 48px; border: 4px solid #e5e5e5; border-top-color: #169bd7; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
          <p style="color: #666;">Carregando...</p>
        </div>
      </DashboardLayout>
    `,
  }),
};
