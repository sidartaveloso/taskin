import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { ref, toRef } from 'vue';
import { buildPriorityTree, usePrioritization } from '../../composables/use-prioritization';
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

const defaultTasks: Task[] = [
  createTask('001', { order: 10, type: 'feat', difficulty: 2 }),
  createTask('002', {
    order: 20,
    type: 'fix',
    groupId: 'g1',
    groupName: 'Backend',
    difficulty: 4,
  }),
  createTask('003', {
    order: 30,
    type: 'refactor',
    groupId: 'g1',
    groupName: 'Backend',
  }),
  createTask('004', { order: 40, type: 'docs' }),
  createTask('005', { order: 50, type: 'test', difficulty: 1 }),
];

export const Default: Story = {
  render: () => ({
    components: { PrioritizationScreen },
    setup() {
      const tasks = ref<Task[]>([...defaultTasks]);
      const { tree, filter, viewMode, sortMode, dragEnabled } = usePrioritization(toRef(tasks));

      return { tree, filter, viewMode, sortMode, dragEnabled };
    },
    template: `
      <PrioritizationScreen
        :tree="tree"
        :filter="filter"
        :view-mode="viewMode"
        :sort-mode="sortMode"
        :drag-enabled="dragEnabled"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ── View mode switching ──
    const cardsBtn = canvas.getByTestId('view-mode-cards');
    const iconsBtn = canvas.getByTestId('view-mode-icons');
    const gridBtn = canvas.getByTestId('view-mode-grid');
    const nodeList = canvasElement.querySelector<HTMLElement>('.node-list')!;

    expect(cardsBtn.className).toContain('active');
    expect(nodeList.className).toContain('view-cards');

    await fireEvent.click(iconsBtn);
    await waitFor(() => {
      expect(iconsBtn.className).toContain('active');
      expect(nodeList.className).toContain('view-icons');
    });

    await fireEvent.click(gridBtn);
    await waitFor(() => {
      expect(gridBtn.className).toContain('active');
      expect(nodeList.className).toContain('view-grid');
    });

    await fireEvent.click(cardsBtn);
    await waitFor(() => {
      expect(cardsBtn.className).toContain('active');
      expect(nodeList.className).toContain('view-cards');
    });

    // ── Sort mode switching ──
    const sortSelect = canvas.getByTestId('sort-select') as HTMLSelectElement;

    function cardIds(): string[] {
      const cards = canvasElement.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]');
      return Array.from(cards).map((c) => c.dataset.testid!.replace('priority-card-', ''));
    }

    expect(sortSelect.value).toBe('manual');
    expect(cardIds().slice(0, 5)).toEqual(['001', '002', '003', '004', '005']);

    await fireEvent.change(sortSelect, { target: { value: 'diff-desc' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('diff-desc');
      const ids = cardIds();
      expect(ids[0]).toBe('002');
      expect(ids[1]).toBe('005');
    });

    await fireEvent.change(sortSelect, { target: { value: 'diff-asc' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('diff-asc');
      const ids = cardIds();
      expect(ids[0]).toBe('004');
      expect(ids[1]).toBe('003');
    });

    await fireEvent.change(sortSelect, { target: { value: 'manual' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('manual');
      expect(cardIds().slice(0, 5)).toEqual(['001', '002', '003', '004', '005']);
    });
  },
};

export const Empty: Story = {
  args: {
    tree: [],
  },
};
