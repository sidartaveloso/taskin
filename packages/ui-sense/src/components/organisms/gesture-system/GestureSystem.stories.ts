import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import { defaultFunctions } from './GestureSystem.types';
import GestureSystem from './GestureSystem.vue';

const meta = {
  title: 'Organisms/GestureSystem',
  component: GestureSystem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '## Keyboard Shortcuts → Gesture Shortcuts',
          '',
          '`GestureSystem` is the entry point for gesture interaction. It composes the webcam, gesture recognition (MediaPipe), the setup wizard and the tracking controls into a single component any screen can adopt.',
          '',
          '### A analogia fundamental',
          '',
          '| Keyboard shortcut | Gesture shortcut |',
          '|------------------|------------------|',
          '| `⌘↑` → moveUp | `☝️` (Pointing_Up) → moveUp |',
          '| `⌘↓` → moveDown | `👎` (Thumb_Down) → moveDown |',
          '| `⌘Z` → undo | `✊` (Closed_Fist) → undo |',
          '| Defined by the OS or app | **Defined by the person** and persisted in `localStorage` |',
          '',
          'The crucial difference: keyboard shortcuts are fixed in hardware, while **gesture shortcuts are defined by the person**, persisted per profile (`userId`), and can be reconfigured at any time without a developer.',
          '',
          '### Where it applies',
          '',
          'Mapping gestures to actions is not limited to accessibility. Any interface that uses keyboard shortcuts today can benefit:',
          '',
          '- **Video walls and TV dashboards** — the gesture replaces a keyboard that is not there',
          '- **Public kiosks** — interaction without physical contact, for hygiene and durability',
          '- **Hands-busy environments** — industrial kitchens, production lines, hospitals',
          '- **Task prioritization** — rearranging cards by hand instead of shortcut plus mouse',
          '- **Meeting rooms** — the presenter navigates content from a distance',
          '',
          '### Como usar',
          '',
          '```vue',
          '<GestureSystem',
          '  :functions="prioritizationFunctions"',
          '  user-id="fernando"',
          '  :detecting="isDetecting"',
          '  @gesture-action="handleAction"',
          '/>',
          '```',
          '',
          'The component owns the whole pipeline: webcam → recognition → wizard → polling → emission. The page only has to declare the configurable actions and react to `gestureAction`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof GestureSystem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    setup() {
      const detecting = ref(false);
      const lastAction = ref<string | null>(null);

      return () =>
        h('div', { style: { position: 'relative', minHeight: '400px', fontFamily: 'system-ui, sans-serif' } }, [
          h('div', { style: { padding: '24px', maxWidth: '480px' } }, [
            h('h2', { style: { fontSize: '20px', marginBottom: '12px' } }, 'GestureSystem Demo'),
            h('p', { style: { fontSize: '14px', color: '#666', marginBottom: '16px' } }, [
              'Click the tracking button in the bottom-right corner to turn the camera on. ',
              'Make hand gestures and watch the detected actions below.',
            ]),
            h(
              'button',
              {
                style: {
                  padding: '8px 16px',
                  background: detecting.value ? '#ef5350' : '#4fc3f7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                },
                onClick: () => {
                  detecting.value = !detecting.value;
                },
              },
              detecting.value ? 'Turn detection off' : 'Turn detection on',
            ),
            lastAction.value
              ? h(
                  'div',
                  {
                    style: {
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: '#e3f2fd',
                      borderRadius: '8px',
                      border: '1px solid #1f7acb',
                      fontSize: '14px',
                    },
                  },
                  [h('strong', 'Last action: '), lastAction.value],
                )
              : null,
          ]),
          h(GestureSystem, {
            functions: defaultFunctions,
            userId: 'storybook-demo',
            detecting: detecting.value,
            'onGesture-action': (action: string) => {
              lastAction.value = action;
            },
          }),
        ]);
    },
  }),
  parameters: {
    docs: {
      description: {
        story: [
          'Interactive GestureSystem demo. Turn detection on and make gestures to try it.',
          '',
          '**Default configurable actions:**',
          '',
          '| Action | Keyboard shortcut | Default gesture |',
          '|--------|---------------|--------------|',
          '| Move up | `⌘↑` | ☝️ Pointing_Up |',
          '| Move down | `⌘↓` | 👎 Thumb_Down |',
          '| Group | `⌘G` | ✌️ Victory |',
          '| Ungroup | `⌘⇧G` | 🖐️ Open_Palm |',
          '| Difficulty 1-5 | `⌘1`-`⌘5` | — |',
          '| Undo | `⌘Z` | ✊ Closed_Fist |',
          '| Copy card | `⌘C` | — |',
        ].join('\n'),
      },
    },
  },
};
