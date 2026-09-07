import { parseTaskId } from '@opentask/taskin-types';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Task } from '../../types';
import { MOCK_DASHBOARD_TASKS } from './Dashboard.mock';
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
    statusText: 'Connected',
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

const createMockTask = (id: number, overrides: Partial<Task> = {}): Task => ({
  id: parseTaskId(String(id)),
  number: 100 + id,
  title: `Tarefa ${id}: Exemplo`,
  status: 'in-progress',
  assignee: {
    id: parseTaskId(String(id)),
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

/**
 * Estado usado para gerar a imagem do dashboard na landing page do site
 * (`packages/docs/content/public/dashboard.png`).
 *
 * Fica versionada aqui, e nao como fixture solta no pacote de docs, para a
 * imagem poder ser regerada quando o dashboard mudar — foi assim que o mascote
 * antigo acabou publicado no site: um asset estatico sem origem reproduzivel.
 *
 * O elenco vem do `Dashboard.mock.ts`, para outras stories poderem usar as
 * mesmas pessoas.
 */
export const LandingShowcase: Story = {
  args: {
    title: 'Taskin Dashboard',
    connectionStatus: 'connected',
    statusText: 'Conectado',
    isLoading: false,
  },
  render: (args) => ({
    components: { Dashboard },
    setup() {
      return { args, tasks: MOCK_DASHBOARD_TASKS };
    },
    template: `<Dashboard v-bind="args" :tasks="tasks" />`,
  }),
};

export const WithError: Story = {
  args: {
    connectionStatus: 'error',
    statusText: 'Erro',
    errorMessage: 'Could not connect to the WebSocket server',
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
    statusText: 'Connecting... ',
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
