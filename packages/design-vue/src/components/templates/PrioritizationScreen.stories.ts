import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { buildPriorityTree } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import PrioritizationScreen from './PrioritizationScreen.vue';

const meta: Meta<typeof PrioritizationScreen> = {
  title: 'Templates/PrioritizationScreen',
  component: PrioritizationScreen,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Presentational screen for the task prioritization board: toolbar (filter, view mode, sort mode, export) plus a drag-and-drop list of task cards and ad hoc groups. Pure props/emits — the `PrioritizationPage` owns the state via `usePrioritization`.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PrioritizationScreen>;

const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  number: Number(id),
  title: `Task ${id}: exemplo de título de tarefa`,
  status: 'pending',
  type: 'feat',
  dates: { created: new Date('2026-07-01') },
  ...overrides,
});

const flatTasks: Task[] = [
  createTask('001', { order: 10, type: 'feat', difficulty: 2 }),
  createTask('002', {
    order: 20,
    type: 'fix',
    groupId: 'g1',
    groupName: 'Backend',
    difficulty: 4,
  }),
  createTask('003', { order: 30, type: 'refactor', groupId: 'g1', groupName: 'Backend' }),
  createTask('004', { order: 40, type: 'docs' }),
  createTask('005', { order: 50, type: 'test', difficulty: 1 }),
];

export const Default: Story = {
  args: {
    tree: buildPriorityTree(flatTasks),
    filter: '',
    viewMode: 'cards',
    sortMode: 'manual',
    dragEnabled: true,
  },
};

export const IconsView: Story = {
  args: {
    ...Default.args,
    viewMode: 'icons',
  },
};

export const GridView: Story = {
  args: {
    ...Default.args,
    viewMode: 'grid',
  },
};

export const SortedByDifficulty: Story = {
  args: {
    ...Default.args,
    sortMode: 'diff-desc',
    dragEnabled: false,
  },
};

export const Empty: Story = {
  args: {
    tree: [],
  },
};
