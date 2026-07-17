import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { computed, h, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { CannedGesture } from '../../composables/use-gesture-recognizer';
import { useGestureRecognizer } from '../../composables/use-gesture-recognizer';
import type { Task } from '../../types';
import WebcamVideo from '../atoms/webcam-video/webcam-video.vue';
import FaceTrackingDebug from '../molecules/face-tracking-debug/face-tracking-debug.vue';
import TrackingControls from '../molecules/tracking-controls/tracking-controls.vue';
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
  createTask('003', {
    order: 30,
    type: 'refactor',
    groupId: 'g1',
    groupName: 'Backend',
  }),
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
  return canvasElement.querySelector<HTMLElement>(
    '[data-testid^="priority-group-"]',
  );
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
async function dragIntoGroup(
  source: HTMLElement,
  groupEl: HTMLElement,
): Promise<void> {
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
          'Exercises the full drag-and-drop lifecycle end-to-end via real DOM drag events: reorder (increase priority), create a group, add a third task to it, reorder tasks inside the group, create a subgroup within the group, remove a task from the group, and dissolve a group when it drops back to a single member.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // 1. Move a task above another → increases its manual priority (reorder).
    await dragOnto(
      getCard(canvasElement, '003'),
      getCard(canvasElement, '001'),
      'before',
    );
    await waitFor(() => {
      const cards = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(
          '[data-testid^="priority-card-"]',
        ),
      );
      const order = cards.map((c) => c.dataset.testid);
      expect(order.indexOf('priority-card-003')).toBeLessThan(
        order.indexOf('priority-card-001'),
      );
    });

    // 2. Move a task into another (middle zone) → creates a new group.
    await dragOnto(
      getCard(canvasElement, '002'),
      getCard(canvasElement, '001'),
      'middle',
    );
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group).not.toBeNull();
      expect(group?.textContent).toContain('2 items');
    });

    // 3. Move one more task into that existing group → group now has 3 items.
    const groupAfterStep2 = getAnyGroup(canvasElement)!;
    await dragIntoGroup(getCard(canvasElement, '004'), groupAfterStep2);
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group?.textContent).toContain('3 items');
      expect(within(group!).getByTestId('priority-card-001')).toBeTruthy();
      expect(within(group!).getByTestId('priority-card-002')).toBeTruthy();
      expect(within(group!).getByTestId('priority-card-004')).toBeTruthy();
    });

    // 4. Reorder tasks inside the group — drag 004 before 001.
    await dragOnto(
      getCard(canvasElement, '004'),
      getCard(canvasElement, '001'),
      'before',
    );
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group?.textContent).toContain('3 items');
      const cardsInGroup = Array.from(
        group!.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]'),
      );
      const order = cardsInGroup.map((c) => c.dataset.testid);
      expect(order).toEqual([
        'priority-card-004',
        'priority-card-001',
        'priority-card-002',
      ]);
    });

    // 5. Create a subgroup — drag 002 onto 001's middle zone (both are in the
    //    same group) → a subgroup is created inside the parent.
    await dragOnto(
      getCard(canvasElement, '002'),
      getCard(canvasElement, '001'),
      'middle',
    );
    await waitFor(() => {
      const parentGroup = getAnyGroup(canvasElement);
      expect(parentGroup).not.toBeNull();
      // Parent has 2 direct items: task 004 + the new subgroup
      expect(parentGroup?.textContent).toContain('2 items');
      // Subgroup is nested inside the parent
      const subGroups = parentGroup!.querySelectorAll<HTMLElement>(
        '[data-testid^="priority-group-"]',
      );
      expect(subGroups.length).toBe(1);
      const subGroup = subGroups[0];
      expect(subGroup.textContent).toContain('2 items');
      expect(within(subGroup).getByTestId('priority-card-001')).toBeTruthy();
      expect(within(subGroup).getByTestId('priority-card-002')).toBeTruthy();
      // Card 004 stays directly in the parent
      expect(
        within(parentGroup!).getByTestId('priority-card-004'),
      ).toBeTruthy();
    });

    // 6. Remove a task from the group (drag it out onto a standalone task) →
    //    group shrinks back to 2 items, the removed task becomes a standalone card.
    await dragOnto(
      getCard(canvasElement, '002'),
      getCard(canvasElement, '003'),
      'after',
    );
    await waitFor(() => {
      const group = getAnyGroup(canvasElement);
      expect(group?.textContent).toContain('2 items');
      expect(
        group?.querySelector('[data-testid="priority-card-002"]'),
      ).toBeNull();
    });

    // 7. Remove the last remaining "extra" task from a group that only had two
    //    members → the group must dissolve entirely (no group node left).
    await dragOnto(
      getCard(canvasElement, '004'),
      getCard(canvasElement, '003'),
      'after',
    );
    await waitFor(() => {
      expect(getAnyGroup(canvasElement)).toBeNull();
    });
  },
};

// ---------------------------------------------------------------------------
// Group drag-and-drop interaction test
// ---------------------------------------------------------------------------

const groupedTasks: Task[] = [
  createTask('001', { order: 10, groupId: 'g1', groupName: 'Alpha' }),
  createTask('002', { order: 20, groupId: 'g1', groupName: 'Alpha' }),
  createTask('003', { order: 30, groupId: 'g2', groupName: 'Beta' }),
  createTask('004', { order: 40, groupId: 'g2', groupName: 'Beta' }),
  createTask('005', { order: 50 }),
  createTask('006', { order: 60 }),
];

function getGroupHead(canvasElement: HTMLElement, index: number): HTMLElement {
  const groups = canvasElement.querySelectorAll<HTMLElement>(
    '[data-testid^="priority-group-"]',
  );
  const group = groups[index];
  if (!group) throw new Error(`Group at index ${index} not found`);
  const head = group.querySelector<HTMLElement>('.group-head');
  if (!head) throw new Error(`Group head at index ${index} not found`);
  return head;
}

/** Simulates dragging a group header onto another group at a given vertical zone. */
async function dragGroupOnto(
  sourceGroupHead: HTMLElement,
  targetGroup: HTMLElement,
  zone: 'before' | 'after' | 'middle',
): Promise<void> {
  const dataTransfer = new DataTransfer();
  const rect = targetGroup.getBoundingClientRect();
  const ratio = zone === 'before' ? 0.1 : zone === 'after' ? 0.9 : 0.5;
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height * ratio;

  await fireEvent.dragStart(sourceGroupHead, { dataTransfer });
  await fireEvent.dragOver(targetGroup, { dataTransfer, clientX, clientY });
  await fireEvent.drop(targetGroup, { dataTransfer, clientX, clientY });
  await fireEvent.dragEnd(sourceGroupHead, { dataTransfer });
}

export const GroupDragInteractions: Story = {
  args: {
    tasks: groupedTasks,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Exercises group-level drag-and-drop: reorder groups by dragging a group header before/after another group, and nest groups by dropping one group onto another.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Initial state: [Alpha(001,002), Beta(003,004), 005, 006]

    // 1. Drag Beta before Alpha → reorder groups
    const alphaGroup = getAnyGroup(canvasElement)!;
    const betaHead = getGroupHead(canvasElement, 1);
    await dragGroupOnto(betaHead, alphaGroup, 'before');
    await waitFor(() => {
      const groups = canvasElement.querySelectorAll<HTMLElement>(
        '[data-testid^="priority-group-"]',
      );
      expect(groups.length).toBe(2);
      // Beta should now be first
      expect(groups[0].textContent).toContain('Beta');
      expect(groups[1].textContent).toContain('Alpha');
    });

    // 2. Drop Alpha onto Beta (middle) → nest both under a parent
    const betaGroupAfterReorder = getAnyGroup(canvasElement)!;
    const alphaHead = getGroupHead(canvasElement, 1);
    await dragGroupOnto(alphaHead, betaGroupAfterReorder, 'middle');
    await waitFor(() => {
      // Only the parent group should show at top level
      const groups = canvasElement.querySelectorAll<HTMLElement>(
        '[data-testid^="priority-group-"]',
      );
      // Parent group + 2 standalone tasks = 1 + 2 direct children
      const nodeList = canvasElement.querySelector('.node-list')!;
      const directChildren = nodeList.children;
      const parentGroup = directChildren[0] as HTMLElement;
      expect(parentGroup?.textContent).toContain('2 items');
      // Subgroups are nested inside the parent
      const subGroups = parentGroup!.querySelectorAll<HTMLElement>(
        '[data-testid^="priority-group-"]',
      );
      expect(subGroups.length).toBe(2);
    });
  },
};

// ---------------------------------------------------------------------------
// Gesture control story — live webcam + gesture recognition + prioritization
// ---------------------------------------------------------------------------

const gestureMockTasks: Task[] = [
  {
    id: '001',
    number: 1,
    title: 'Implementar login',
    status: 'pending',
    type: 'feat',
    order: 10,
    difficulty: 3,
    dates: { created: new Date() },
  },
  {
    id: '002',
    number: 2,
    title: 'Corrigir bug no cadastro',
    status: 'pending',
    type: 'fix',
    order: 20,
    difficulty: 4,
    dates: { created: new Date() },
  },
  {
    id: '003',
    number: 3,
    title: 'Refatorar módulo de pagamento',
    status: 'pending',
    type: 'refactor',
    order: 30,
    difficulty: 5,
    dates: { created: new Date() },
  },
  {
    id: '004',
    number: 4,
    title: 'Adicionar testes',
    status: 'pending',
    type: 'test',
    order: 40,
    difficulty: 2,
    dates: { created: new Date() },
  },
  {
    id: '005',
    number: 5,
    title: 'Documentar API',
    status: 'pending',
    type: 'docs',
    order: 50,
    difficulty: 1,
    dates: { created: new Date() },
  },
  {
    id: '006',
    number: 6,
    title: 'Configurar CI/CD',
    status: 'pending',
    type: 'chore',
    order: 60,
    difficulty: 2,
    dates: { created: new Date() },
  },
];

const gestureEmojiMap: Record<string, string> = {
  Pointing_Up: '☝️',
  Thumb_Down: '👎',
  Victory: '✌️',
  Open_Palm: '🖐️',
  Closed_Fist: '✊',
  Thumb_Up: '👍',
  ILoveYou: '🤟',
  None: '🫥',
};

const gestureNameMap: Record<string, string> = {
  Pointing_Up: 'Subir',
  Thumb_Down: 'Descer',
  Victory: 'Agrupar',
  Open_Palm: 'Desagrupar',
  Closed_Fist: 'Desfazer',
  Thumb_Up: 'OK',
  ILoveYou: 'Join',
  None: '—',
};

export const GestureControl: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(true);

      const gestureRecognizer = useGestureRecognizer(videoElement, {
        numHands: 2,
        gestureScoreThreshold: 0.6,
      });

      onMounted(async () => {
        if (webcamVideoRef.value) {
          videoElement.value = webcamVideoRef.value.videoElement;
        }
        await nextTick();
        gestureRecognizer.startDetection();
      });

      const toggleDetection = () => {
        if (gestureRecognizer.state.value.isDetecting) {
          gestureRecognizer.stopDetection();
        } else {
          gestureRecognizer.startDetection();
        }
      };

      const getStableGesture = () => {
        const gest = gestureRecognizer.getDominantGesture();
        if (!gest || gest.gesture === 'None' || gest.score < 0.6) return null;
        return { gesture: gest.gesture as CannedGesture, score: gest.score };
      };

      const isGestureHeld = (gesture: CannedGesture, ms = 600) => {
        return gestureRecognizer.isGestureHeld(gesture, ms);
      };

      const debugInfo = computed(() => {
        const g = gestureRecognizer.state.value.gestures;
        if (g.length === 0) return null;
        const info: Record<string, unknown> = {};
        g.forEach((gest, i) => {
          info[`mão ${i + 1} (${gest.handedness})`] = {
            gesto: gestureNameMap[gest.gesture] || gest.gesture,
            confiança: (gest.score * 100).toFixed(1) + '%',
          };
        });
        return info;
      });

      onUnmounted(() => {
        gestureRecognizer.stopDetection();
      });

      return () =>
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '16px',
              position: 'relative',
              minHeight: '100vh',
              fontFamily: 'system-ui, sans-serif',
            },
          },
          [
            // Top bar: webcam + controls
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap',
                },
              },
              [
                h(WebcamVideo, {
                  ref: webcamVideoRef,
                  visible: showWebcam.value,
                  width: 240,
                  height: 180,
                  mirrored: true,
                }),
                h(TrackingControls, {
                  isDetecting: gestureRecognizer.state.value.isDetecting,
                  error: gestureRecognizer.state.value.error,
                  showWebcam: showWebcam.value,
                  syncEyes: false,
                  syncMouth: false,
                  syncExpressions: false,
                  syncArms: false,
                  syncGestures: true,
                  disabled: false,
                  'onToggle-tracking': toggleDetection,
                  'onUpdate:showWebcam': (v: boolean) => {
                    showWebcam.value = v;
                  },
                }),
                // Live gesture indicator
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#f0f8ff',
                      border: '1px solid #b3d9ff',
                      borderRadius: '8px',
                      fontSize: '14px',
                    },
                  },
                  [
                    h(
                      'span',
                      { style: { fontSize: '24px' } },
                      (() => {
                        const g = getStableGesture();
                        return g ? gestureEmojiMap[g.gesture] || '🫥' : '🫥';
                      })(),
                    ),
                    h(
                      'span',
                      { style: { fontWeight: 600 } },
                      (() => {
                        const g = getStableGesture();
                        return g
                          ? `${gestureNameMap[g.gesture] || g.gesture}`
                          : 'Aguardando gesto...';
                      })(),
                    ),
                  ],
                ),
              ],
            ),
            // Legend: which gesture does what
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  fontSize: '12px',
                  color: '#666',
                  padding: '4px 0',
                },
              },
              [
                h('span', null, '☝️ subir'),
                h('span', null, '👎 descer'),
                h('span', null, '✌️ agrupar'),
                h('span', null, '🖐️ desagrupar'),
                h('span', null, '✊ desfazer'),
                h(
                  'span',
                  { style: { color: '#4fc3f7' } },
                  '🖐️ (2s) configurar atalhos',
                ),
              ],
            ),
            // The actual prioritization page — receives gesture callbacks
            h(PrioritizationPage, {
              tasks: gestureMockTasks,
              getStableGesture,
              isGestureHeld,
              gestureUserId: 'storybook-demo',
              'onUpdate-task': () => {},
              'onUpdate-tasks': () => {},
            }),
            // Debug overlay
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Gesture Recognizer',
              position: 'bottom-right',
            }),
          ],
        );
    },
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          '📹 Controle total da priorização por gestos manuais via webcam. Selecione um card clicando nele (borda azul), depois faça o gesto. Mantenha a mão aberta por 2s para abrir o wizard de configuração de atalhos. Use 👍/👎 para navegar e ✊ para confirmar.',
      },
    },
  },
};
