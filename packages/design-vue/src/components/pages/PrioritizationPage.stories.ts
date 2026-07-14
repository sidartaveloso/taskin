import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import type { Task } from '../../types';
import PrioritizationPage from './PrioritizationPage.vue';

const meta: Meta<typeof PrioritizationPage> = {
  title: 'Pages/PrioritizationPage',
  component: PrioritizationPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Smart "page" component for the task prioritization board: owns the `usePrioritization` composable (drag reorder, ad hoc grouping, difficulty, filter, view/sort prefs, change tracking) and renders `PrioritizationScreen`, emitting `update-task`/`update-tasks` whenever the manual order, group, or difficulty of a task changes so the host app can persist it.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PrioritizationPage>;

const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  number: Number(id),
  title: `Task ${id}: exemplo de título de tarefa`,
  status: 'pending',
  type: 'feat',
  dates: { created: new Date('2026-07-01') },
  ...overrides,
});

const mockTasks: Task[] = [
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
  createTask('006', { type: 'chore' }),
];

export const Default: Story = {
  args: {
    tasks: mockTasks,
  },
};

export const Unprioritized: Story = {
  args: {
    tasks: mockTasks.map(({ id, title, type, status, dates }) => ({
      id,
      title,
      type,
      status,
      dates,
      number: Number(id),
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tasks with no prior `order`/`groupId`/`difficulty` — the initial state before anyone has prioritized anything.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Drag-and-drop interaction tests (play function)
//
// PrioritizationScreen's drag handlers read `event.clientY` relative to the
// target's `getBoundingClientRect()` to decide the drop zone: <30% = "before"
// (reorder above), >70% = "after" (reorder below), the middle 30-70% = "group"
// (create/join a group). These only produce real geometry in an actual
// browser, which is why this runs through `@storybook/addon-vitest`'s
// Playwright/Chromium project rather than jsdom.
// ---------------------------------------------------------------------------

function getCard(canvasElement: HTMLElement, taskId: string): HTMLElement {
  const el = canvasElement.querySelector<HTMLElement>(
    `[data-testid="priority-card-${taskId}"]`,
  );
  if (!el) throw new Error(`Card ${taskId} not found`);
  return el;
}

function getAnyGroup(canvasElement: HTMLElement): HTMLElement | null {
  return canvasElement.querySelector<HTMLElement>('[data-testid^="priority-group-"]');
}

/** Simulates a full native HTML5 drag gesture from `source` onto `target`, at a given vertical zone. */
async function dragOnto(
  source: HTMLElement,
  target: HTMLElement,
  zone: 'before' | 'after' | 'middle',
): Promise<void> {
  const dataTransfer = new DataTransfer();
  const rect = target.getBoundingClientRect();
  const ratio = zone === 'before' ? 0.1 : zone === 'after' ? 0.9 : 0.5;
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height * ratio;

  await fireEvent.dragStart(source, { dataTransfer });
  await fireEvent.dragOver(target, { dataTransfer, clientX, clientY });
  await fireEvent.drop(target, { dataTransfer, clientX, clientY });
  await fireEvent.dragEnd(source, { dataTransfer });
}

/** Simulates dragging `source` into an existing group container (adds it as a member). */
async function dragIntoGroup(source: HTMLElement, groupEl: HTMLElement): Promise<void> {
  const dataTransfer = new DataTransfer();
  await fireEvent.dragStart(source, { dataTransfer });
  await fireEvent.dragOver(groupEl, { dataTransfer });
  await fireEvent.drop(groupEl, { dataTransfer });
  await fireEvent.dragEnd(source, { dataTransfer });
}

const dragTasks: Task[] = [
  createTask('001', { order: 10, type: 'feat' }),
  createTask('002', { order: 20, type: 'fix' }),
  createTask('003', { order: 30, type: 'refactor' }),
  createTask('004', { order: 40, type: 'docs' }),
];

export const DragAndDropInteractions: Story = {
  args: {
    tasks: dragTasks,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Exercises the full drag-and-drop lifecycle end-to-end via real DOM drag events: reorder (increase priority), create a group, add a third task to it, remove a task from the group, and dissolve a group when it drops back to a single member.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // 1. Move a task above another → increases its manual priority (reorder).
    await dragOnto(getCard(canvasElement, '003'), getCard(canvasElement, '001'), 'before');
    await waitFor(() => {
      const cards = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]'),
      );
      const order = cards.map((c) => c.dataset.testid);
      expect(order.indexOf('priority-card-003')).toBeLessThan(
        order.indexOf('priority-card-001'),
      );
    });

    // 2. Move a task into another (middle zone) → creates a new group.
    await dragOnto(getCard(canvasElement, '002'), getCard(canvasElement, '001'), 'middle');
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group).not.toBeNull();
      expect(group?.textContent).toContain('2 tasks');
    });

    // 3. Move one more task into that existing group → group now has 3 tasks.
    const groupAfterStep2 = getAnyGroup(canvasElement)!;
    await dragIntoGroup(getCard(canvasElement, '004'), groupAfterStep2);
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group?.textContent).toContain('3 tasks');
      expect(within(group!).getByTestId('priority-card-001')).toBeTruthy();
      expect(within(group!).getByTestId('priority-card-002')).toBeTruthy();
      expect(within(group!).getByTestId('priority-card-004')).toBeTruthy();
    });

    // 4. Remove a task from the group (drag it out onto a standalone task) →
    //    group shrinks back to 2 tasks, the removed task becomes a standalone card.
    await dragOnto(getCard(canvasElement, '002'), getCard(canvasElement, '003'), 'after');
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group?.textContent).toContain('2 tasks');
      expect(group?.querySelector('[data-testid="priority-card-002"]')).toBeNull();
    });

    // 5. Remove the last remaining "extra" task from a group that only had two
    //    members → the group must dissolve entirely (no group node left).
    await dragOnto(getCard(canvasElement, '004'), getCard(canvasElement, '003'), 'after');
    await waitFor(() => {
      expect(getAnyGroup(canvasElement)).toBeNull();
    });
  },
};
