import { parseTaskId } from '@opentask/taskin-types';
import { defaultFunctions, WebcamVideo } from '@opentask/ui-sense';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { h, ref, toRef } from 'vue';
import {
  buildPriorityTree,
  type PrioritizationSortMode,
  usePrioritization,
} from '../../composables/use-prioritization';
import type { Task } from '../../types';
import { groupId } from '../../types';
import PrioritizationScreen from './PrioritizationScreen.vue';

const meta: Meta<typeof PrioritizationScreen> = {
  title: 'Templates/PrioritizationScreen',
  component: PrioritizationScreen,
  tags: ['autodocs', 'design-vue'],
  parameters: {
    docs: {
      description: {
        component:
          'Presentational screen for the task prioritization board: toolbar (view mode, collapse/expand, undo/redo, export — search, sort and score live in the dashboard top bar since task-129) plus a drag-and-drop list of task cards and ad hoc groups. Pure props/emits — the `PrioritizationPage` owns the state via `usePrioritization`.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PrioritizationScreen>;

const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id: parseTaskId(id),
  number: Number(id),
  title: `Task ${id}: example task title`,
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
    parent: { type: 'group', id: groupId('g1') },
    groupName: 'Backend',
    difficulty: 4,
  }),
  createTask('003', {
    order: 30,
    type: 'refactor',
    parent: { type: 'group', id: groupId('g1') },
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
      const { tree, viewMode, dragEnabled, setViewMode } = usePrioritization(toRef(tasks));

      return { tree, viewMode, dragEnabled, setViewMode };
    },
    template: `
      <PrioritizationScreen
        :tree="tree"
        :view-mode="viewMode"
        :drag-enabled="dragEnabled"
        @update:view-mode="setViewMode"
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
  },
};

/*
 * A ordem vem de fora (task-129): quem hospeda escolhe o modo, e a arvore sai
 * do `ordenarTarefas` do dominio. Em `diff-desc` o grupo fica no lugar do
 * membro mais dificil, e a tarefa sem nota vai para o fim.
 */
export const SortedByTheHost: Story = {
  render: () => ({
    components: { PrioritizationScreen },
    setup() {
      const tasks = ref<Task[]>([...defaultTasks]);
      const { tree, viewMode, dragEnabled } = usePrioritization(toRef(tasks), {
        sortMode: ref<PrioritizationSortMode>('diff-desc'),
      });

      return { tree, viewMode, dragEnabled };
    },
    template: `<PrioritizationScreen :tree="tree" :view-mode="viewMode" :drag-enabled="dragEnabled" />`,
  }),
  play: async ({ canvasElement }) => {
    const cards = canvasElement.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]');
    const ids = Array.from(cards).map((c) => c.dataset.testid!.replace('priority-card-', ''));

    expect(ids).toEqual(['002', '003', '001', '005', '004']);
    expect(canvasElement.querySelector('.drag-warning')).not.toBeNull();
  },
};

export const Empty: Story = {
  args: {
    tree: [],
  },
};

export const WithGesture: Story = {
  tags: ['webcam'],
  render: () => ({
    components: { PrioritizationScreen, WebcamVideo },
    setup() {
      const showWebcam = ref(true);
      const detecting = ref(false);
      const cameraActive = ref(false);

      return () =>
        h(
          'div',
          { style: { padding: '16px', position: 'relative', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' } },
          [
            h(WebcamVideo, {
              visible: showWebcam.value,
              width: 240,
              height: 180,
              mirrored: true,
            }),
            h(PrioritizationScreen, {
              tree: buildPriorityTree(defaultTasks),
              viewMode: 'cards',
              dragEnabled: true,
              detecting: detecting.value,
              cameraActive: cameraActive.value,
              gestureFunctions: defaultFunctions,
              gestureUserId: 'storybook-test',
              'onToggle-tracking': () => {
                detecting.value = !detecting.value;
              },
              'onUpdate:cameraActive': (v: boolean) => {
                cameraActive.value = v;
              },
            }),
            cameraActive.value
              ? h('div', { style: { marginTop: '8px', fontSize: '13px', color: '#4caf50' } }, '📷 Camera on')
              : h('div', { style: { marginTop: '8px', fontSize: '13px', color: '#999' } }, '⏳ Waiting for camera...'),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'PrioritizationScreen com GestureSystem integrado. TrackingControls + GestureLegend aparecem no canto inferior direito.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const video = canvasElement.querySelector<HTMLElement>('.webcam-video');
    expect(video).not.toBeNull();
    expect(video!.className).toContain('visible');

    // Fixed container is always visible when gesture features are enabled
    const fixed = canvasElement.querySelector<HTMLElement>('.prioritization-screen__fixed');
    expect(fixed).not.toBeNull();

    // Tracking controls are always visible (start/stop detection)
    const trackingBtn = within(fixed!).getByText('Start Detection');
    expect(trackingBtn).not.toBeNull();

    // GestureSystem is always mounted (needs to be to detect detecting changes)
    const gestureSystem = fixed!.querySelector<HTMLElement>('.gesture-system');
    expect(gestureSystem).not.toBeNull();

    // GestureLegend is NOT rendered yet (camera not streaming)
    const legend = gestureSystem!.querySelector<HTMLElement>('.gesture-system__legend');
    expect(legend).toBeNull();

    // Camera-status indicator is NOT shown yet (detecting is false)
    const statusBefore = canvasElement.querySelector<HTMLElement>('.prioritization-screen__camera-status');
    expect(statusBefore).toBeNull();

    // ── User clicks "Start Detection" ──
    await fireEvent.click(trackingBtn);

    // Camera-status indicator appears while camera initializes (detecting=true, cameraActive=false)
    await waitFor(() => {
      const status = canvasElement.querySelector<HTMLElement>('.prioritization-screen__camera-status');
      expect(status).not.toBeNull();
      expect(status!.textContent).toContain('Starting camera');
    });

    // Button still shows "Start Detection" because cameraActive is still false
    // (no real camera stream in test environment)
    expect(() => within(fixed!).getByText('Start Detection')).not.toThrow();

    // GestureLegend still not rendered (camera never actually streams in test)
    const legendAfter = gestureSystem!.querySelector<HTMLElement>('.gesture-system__legend');
    expect(legendAfter).toBeNull();

    // The hidden <video> element is provided by the screen
    const fixedVideo = fixed!.querySelector('video');
    expect(fixedVideo).not.toBeNull();
  },
};
