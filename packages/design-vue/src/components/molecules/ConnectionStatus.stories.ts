import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ConnectionStatus from './ConnectionStatus.vue';

const meta: Meta<typeof ConnectionStatus> = {
  title: 'Molecules/Task/ConnectionStatus',
  component: ConnectionStatus,
  tags: ['autodocs', 'design-vue'],
  parameters: {
    docs: {
      description: {
        component:
          'The connection to the server: a coloured dot, the status text and, on error, a retry button. It lives outside `DashboardHeader` so a host can show it in a place shared by several screens.',
      },
    },
  },
  argTypes: {
    status: { control: 'select', options: ['connected', 'disconnected', 'connecting', 'error'] },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionStatus>;

export const Connected: Story = { args: { status: 'connected', statusText: 'Connected' } };

export const Connecting: Story = { args: { status: 'connecting', statusText: 'Connecting...' } };

export const Disconnected: Story = { args: { status: 'disconnected', statusText: 'Disconnected' } };

export const ErrorWithRetry: Story = {
  args: { status: 'error', statusText: 'Connection error', showRetry: true },
};

export const Retrying: Story = {
  args: { status: 'error', statusText: 'Connection error', showRetry: true, isRetrying: true },
};
