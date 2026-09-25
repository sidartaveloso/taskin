import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MOCK_DASHBOARD_TASKS } from './TaskinWorkspace.mock';
import TaskinWorkspace from './TaskinWorkspace.vue';

const meta: Meta<typeof TaskinWorkspace> = {
  title: 'Pages/TaskinWorkspace',
  component: TaskinWorkspace,
  tags: ['autodocs', 'design-vue'],
  parameters: {
    docs: {
      description: {
        component:
          'The whole dashboard screen: the top bar (screen, status filter, search, order, score, count and connection) and the switch between the Board and the prioritization board. It reads no URL and no store, and filters nothing — the host hands it the tasks already sliced by the domain and the current choices, and receives each choice back as `update:*` (task-132).',
      },
    },
    layout: 'fullscreen',
  },
  args: {
    tasks: MOCK_DASHBOARD_TASKS,
    total: MOCK_DASHBOARD_TASKS.length + 4,
    view: 'board',
    filter: 'open',
    search: '',
    sort: 'manual',
    score: 'all',
    connectionStatus: 'connected',
    statusText: 'Connected',
    'onUpdate:view': fn(),
    'onUpdate:filter': fn(),
    'onUpdate:search': fn(),
    'onUpdate:sort': fn(),
    'onUpdate:score': fn(),
    onRetry: fn(),
    'onUpdate-task': fn(),
    'onUpdate-group': fn(),
    onMove: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TaskinWorkspace>;

export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('filter-count')).toHaveTextContent(
      `Showing ${MOCK_DASHBOARD_TASKS.length} of ${MOCK_DASHBOARD_TASKS.length + 4} tasks`,
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Prioritization' }));
    await expect(args['onUpdate:view']).toHaveBeenCalledWith('prioritization');

    await userEvent.click(canvas.getByRole('button', { name: 'Closed' }));
    await expect(args['onUpdate:filter']).toHaveBeenCalledWith('closed');

    await userEvent.type(canvas.getByTestId('search-input'), 'x');
    await expect(args['onUpdate:search']).toHaveBeenCalledWith('x');
  },
};

export const Prioritization: Story = {
  args: { view: 'prioritization' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Prioritization' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Board' }));
    await expect(args['onUpdate:view']).toHaveBeenCalledWith('board');

    await userEvent.click(canvas.getByRole('button', { name: 'All' }));
    await expect(args['onUpdate:filter']).toHaveBeenCalledWith('all');
  },
};

export const ConnectionLost: Story = {
  args: {
    connectionStatus: 'error',
    statusText: 'Connection error',
    connectionError: 'O servidor nao responde em ws://localhost:3001',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('O servidor nao responde');
    await userEvent.click(canvas.getByRole('button', { name: 'Tentar novamente' }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

export const EmptySlice: Story = {
  args: { tasks: [], filter: 'closed', search: 'nada casa com isto' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('filter-count')).toHaveTextContent(
      `Showing 0 of ${MOCK_DASHBOARD_TASKS.length + 4} tasks`,
    );
    await userEvent.clear(canvas.getByTestId('search-input'));
    await expect(args['onUpdate:search']).toHaveBeenCalledWith('');
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Prioritization' }));
    await expect(args['onUpdate:view']).toHaveBeenCalledWith('prioritization');
  },
};
