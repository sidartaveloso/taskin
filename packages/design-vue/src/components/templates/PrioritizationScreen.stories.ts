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

const flatTasks: Task[] = [
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

// ---------------------------------------------------------------------------
// View Mode switching — play function
// ---------------------------------------------------------------------------

export const ViewModeSwitching: Story = {
  render: () => ({
    components: { PrioritizationScreen },
    data() {
      return {
        tree: buildPriorityTree(flatTasks),
        filter: '',
        viewMode: 'cards' as string,
        sortMode: 'manual',
        dragEnabled: true,
      };
    },
    template: `
      <PrioritizationScreen
        :tree="tree"
        :filter="filter"
        :view-mode="viewMode"
        :sort-mode="sortMode"
        :drag-enabled="dragEnabled"
        @update:view-mode="viewMode = $event"
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive view mode switching between cards, icons and grid. Click each button to verify the active state changes and the container class updates accordingly.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const cardsBtn = canvas.getByTestId('view-mode-cards');
    const iconsBtn = canvas.getByTestId('view-mode-icons');
    const gridBtn = canvas.getByTestId('view-mode-grid');

    expect(cardsBtn.className).toContain('active');
    expect(iconsBtn.className).not.toContain('active');
    expect(gridBtn.className).not.toContain('active');

    const nodeList = canvasElement.querySelector<HTMLElement>('.node-list')!;
    expect(nodeList.className).toContain('view-cards');

    await fireEvent.click(iconsBtn);
    await waitFor(() => {
      expect(iconsBtn.className).toContain('active');
      expect(cardsBtn.className).not.toContain('active');
      expect(nodeList.className).toContain('view-icons');
    });

    await fireEvent.click(gridBtn);
    await waitFor(() => {
      expect(gridBtn.className).toContain('active');
      expect(iconsBtn.className).not.toContain('active');
      expect(nodeList.className).toContain('view-grid');
    });

    await fireEvent.click(cardsBtn);
    await waitFor(() => {
      expect(cardsBtn.className).toContain('active');
      expect(gridBtn.className).not.toContain('active');
      expect(nodeList.className).toContain('view-cards');
    });
  },
};

// ---------------------------------------------------------------------------
// Sort mode switching — play function
// ---------------------------------------------------------------------------

export const SortModeSwitching: Story = {
  render: () => ({
    components: { PrioritizationScreen },
    setup() {
      const tasks = ref<Task[]>([
        createTask('001', { order: 10, type: 'feat', difficulty: 2 }),
        createTask('002', { order: 20, type: 'fix', difficulty: 5 }),
        createTask('003', { order: 30, type: 'refactor', difficulty: 1 }),
        createTask('004', { order: 40, type: 'docs' }),
        createTask('005', { order: 50, type: 'test', difficulty: 3 }),
      ]);

      const { tree, sortMode, setSortMode, dragEnabled, filter, viewMode } = usePrioritization(toRef(tasks));

      return { tree, sortMode, setSortMode, dragEnabled, filter, viewMode };
    },
    template: `
      <PrioritizationScreen
        :tree="tree"
        :filter="filter"
        :view-mode="viewMode"
        :sort-mode="sortMode"
        :drag-enabled="dragEnabled"
        @update:sort-mode="setSortMode"
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive sort mode switching. The `usePrioritization` composable owns the state and re-computes the sorted tree when sort mode changes.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const sortSelect = canvas.getByTestId('sort-select') as HTMLSelectElement;

    function cardIds(): string[] {
      const cards = canvasElement.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]');
      return Array.from(cards).map((c) => c.dataset.testid!.replace('priority-card-', ''));
    }

    // Start in manual mode — cards ordered by `order` field
    expect(sortSelect.value).toBe('manual');
    expect(cardIds()).toEqual(['001', '002', '003', '004', '005']);

    // Switch to diff-desc (difficulty highest first)
    await fireEvent.change(sortSelect, { target: { value: 'diff-desc' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('diff-desc');
      // 002 (diff=5), 005 (diff=3), 001 (diff=2), 003 (diff=1), 004 (no diff)
      const ids = cardIds();
      expect(ids[0]).toBe('002');
      expect(ids[1]).toBe('005');
    });

    // Switch to diff-asc (difficulty lowest first)
    await fireEvent.change(sortSelect, { target: { value: 'diff-asc' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('diff-asc');
      const ids = cardIds();
      expect(ids[0]).toBe('004'); // no diff
      expect(ids[1]).toBe('003'); // diff=1
      expect(ids[ids.length - 1]).toBe('002'); // diff=5
    });

    // Switch back to manual
    await fireEvent.change(sortSelect, { target: { value: 'manual' } });
    await waitFor(() => {
      expect(sortSelect.value).toBe('manual');
      expect(cardIds()).toEqual(['001', '002', '003', '004', '005']);
    });
  },
};
