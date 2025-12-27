import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Task } from '../../types';
import Dashboard from './Dashboard.vue';

const meta: Meta<typeof Dashboard> = {
  title: 'Templates/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Dashboard title' },
    connectionStatus: {
      control: 'select',
      options: ['connected', 'disconnected', 'connecting', 'error'],
    },
    statusText: { control: 'text' },
    errorMessage: { control: 'text' },
    showRetry: { control: 'boolean' },
    isRetrying: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    tasks: { control: 'object' },
  },
  args: {
    title: 'Taskin Dashboard',
    connectionStatus: 'connected',
    statusText: 'Conectado',
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

const createMockTask = (id: number, overrides: Partial<Task> = {}): Task => ({
  id: String(id),
  number: 100 + id,
  title: `Tarefa ${id}: Exemplo`,
  status: 'in-progress',
  assignee: {
    id: String(id),
    name: `Dev ${id}`,
    email: `dev${id}@example.com`,
  },
  project: { segments: ['Example', 'Dashboard'] },
  estimates: { estimated: 8, spent: 2, remaining: 6 },
  dates: { created: new Date() },
  progress: { percentage: 30 },
  tags: ['example'],
  warnings: [],
  ...overrides,
});

const mockTasks: Task[] = [
  createMockTask(1),
  createMockTask(2, { status: 'blocked' }),
  createMockTask(3, { status: 'done', progress: { percentage: 100 } }),
];

export const Default: Story = {
  args: {
    tasks: mockTasks,
  },
  render: (args) => ({
    components: { Dashboard },
    setup() {
      return { args, tasks: mockTasks };
    },
    template: `<Dashboard v-bind="args" :tasks="tasks" />`,
  }),
};

export const WithError: Story = {
  args: {
    connectionStatus: 'error',
    statusText: 'Erro',
    errorMessage: 'Não foi possível conectar ao servidor WebSocket',
    showRetry: true,
    tasks: [],
  },
  render: (args) => ({
    components: { Dashboard },
    setup() {
      return { args };
    },
    template: `<Dashboard v-bind="args" />`,
  }),
};

export const Connecting: Story = {
  args: {
    connectionStatus: 'connecting',
    statusText: 'Conectando... ',
    isLoading: true,
    tasks: [],
  },
  render: (args) => ({
    components: { Dashboard },
    setup() {
      return { args };
    },
    template: `<Dashboard v-bind="args" />`,
  }),
};
