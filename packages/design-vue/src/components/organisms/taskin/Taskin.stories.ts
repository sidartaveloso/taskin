import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue';
import Taskin from './Taskin';
import { TASKIN_ACTIONS, type TaskinAction } from './Taskin.actions';
import { TASKIN_MOODS } from './Taskin.moods';
import type { TaskinMood } from './Taskin.types';
import { TASKIN_VARIANTS } from './Taskin.variants';

const meta = {
  title: 'Organisms/Taskin/Taskin',
  component: Taskin,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Compositional Taskin mascot built entirely from atomic and molecular components.',
      },
    },
  },
  tags: ['autodocs', 'design-vue'],
  argTypes: {
    mood: {
      control: 'select',
      options: [...TASKIN_MOODS],
      description: 'The mood state of the Taskin mascot',
    },
    variant: {
      control: 'select',
      options: [...TASKIN_VARIANTS],
      description: 'Which character to draw: the Taskin octopus or the Sapin frog',
    },
    size: {
      control: { type: 'number', min: 50, max: 500, step: 10 },
      description: 'Size of the Taskin mascot in pixels',
    },
    animationsEnabled: {
      control: 'boolean',
      description: 'Enable all animations',
    },
    idleAnimation: {
      control: 'boolean',
      description: 'Enable idle animations (blink, wiggle tentacles)',
    },
    eyeTrackingMode: {
      control: 'select',
      options: ['none', 'mouse', 'element', 'custom'],
      description: 'Eye tracking mode',
    },
    eyeTrackingBounds: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'How far the pupils can move from center',
    },
    eyeLookDirection: {
      control: 'select',
      options: ['center', 'left', 'right', 'up', 'down'],
      description: 'Manual look direction (when eyeTrackingMode is "none")',
    },
  },
  args: {
    mood: 'neutral',
    size: 200,
    animationsEnabled: true,
    idleAnimation: true,
  },
} satisfies Meta<typeof Taskin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllMoods: Story = {
  render: (args) => ({
    components: { Taskin },
    template: `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 20px;">
        <div v-for="mood in moods" :key="mood" style="text-align: center;">
          <Taskin :mood="mood" :size="150" :variant="variant" />
          <p style="margin-top: 10px; font-size: 12px;">{{ mood }}</p>
        </div>
      </div>
    `,
    data() {
      return { moods: TASKIN_MOODS, variant: args.variant };
    },
  }),
};

/**
 * Um botao por acao de `TASKIN_ACTIONS`, chamando `play()` pela ref: as acoes
 * novas aparecem aqui sozinhas. Ao lado, a ultima que terminou.
 */
export const Actions: Story = {
  render: (args) =>
    defineComponent({
      components: { Taskin },
      setup() {
        const taskin = ref<{ play: (action: TaskinAction) => Promise<boolean> } | null>(null);
        const ultima = ref<string>('-');
        const tocar = async (action: TaskinAction) => {
          if (await taskin.value?.play(action)) ultima.value = action;
        };
        return { args, actions: TASKIN_ACTIONS, taskin, ultima, tocar };
      },
      template: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <Taskin ref="taskin" v-bind="args" />
          <div style="display: flex; gap: 8px; align-items: center;">
            <button v-for="action in actions" :key="action" type="button" @click="tocar(action)">{{ action }}</button>
            <span style="font-size: 12px;">ultima: <strong data-testid="ultima-acao">{{ ultima }}</strong></span>
          </div>
        </div>
      `,
    }),
};

export const Default: Story = {
  args: {
    mood: 'neutral',
  },
};

export const Happy: Story = {
  args: {
    mood: 'happy',
  },
  parameters: {
    backgrounds: { default: 'yellow' },
  },
};

export const Crying: Story = {
  args: {
    mood: 'crying',
  },
  parameters: {
    backgrounds: { default: 'blue' },
  },
};

export const Furious: Story = {
  args: {
    mood: 'furious',
  },
  parameters: {
    backgrounds: { default: 'red' },
  },
};

export const Thinking: Story = {
  args: {
    mood: 'thoughtful',
  },
};

export const Annoyed: Story = {
  args: {
    mood: 'annoyed',
  },
  parameters: {
    backgrounds: { default: 'gray' },
  },
};

export const Cold: Story = {
  args: {
    mood: 'cold',
  },
  parameters: {
    backgrounds: { default: 'ice-blue' },
  },
};

export const Hot: Story = {
  args: {
    mood: 'hot',
  },
  parameters: {
    backgrounds: { default: 'red' },
  },
};

export const Dancing: Story = {
  args: {
    mood: 'dancing',
  },
  parameters: {
    backgrounds: { default: 'purple' },
  },
};

export const Sleeping: Story = {
  args: {
    mood: 'sleeping',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const InLove: Story = {
  args: {
    mood: 'in-love',
  },
  parameters: {
    backgrounds: { default: 'pink' },
  },
};

export const Tired: Story = {
  args: {
    mood: 'tired',
  },
  parameters: {
    backgrounds: { default: 'gray' },
  },
};

export const Thoughtful: Story = {
  args: {
    mood: 'thoughtful',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const Vomiting: Story = {
  args: {
    mood: 'vomiting',
  },
  parameters: {
    backgrounds: { default: 'green' },
  },
};

export const TakingSelfie: Story = {
  args: {
    mood: 'taking-selfie',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const Farting: Story = {
  args: {
    mood: 'farting',
  },
  parameters: {
    backgrounds: { default: 'green' },
  },
};

export const WithIdleAnimations: Story = {
  args: {
    mood: 'neutral',
    animationsEnabled: true,
    idleAnimation: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Taskin with idle animations enabled. Watch it blink and wiggle its tentacles every few seconds.',
      },
    },
  },
};

export const WithoutAnimations: Story = {
  args: {
    mood: 'dancing',
    animationsEnabled: false,
    idleAnimation: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Taskin with all animations disabled, including mood-specific and idle animations.',
      },
    },
  },
};

export const EyeTrackingMouse: Story = {
  args: {
    mood: 'neutral',
    eyeTrackingMode: 'mouse',
  },
  parameters: {
    docs: {
      description: {
        story: 'Taskin with eyes following the mouse cursor. Move your mouse around to see the eyes track it.',
      },
    },
  },
};

export const EyeTrackingElement: Story = {
  render: (args) => {
    const targetElement = ref<HTMLElement | undefined>(undefined);
    const buttonPos = ref({ x: 0, y: 0 });
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      isDragging.value = true;
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
      dragOffset.value = {
        x: clientX - buttonPos.value.x,
        y: clientY - buttonPos.value.y,
      };
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return;
      e.preventDefault();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
      buttonPos.value = {
        x: clientX - dragOffset.value.x,
        y: clientY - dragOffset.value.y,
      };
    };

    const handleDragEnd = () => {
      isDragging.value = false;
    };

    onMounted(() => {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleDragEnd);
    });

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    });

    return () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
          },
        },
        [
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                transform: `translate(${buttonPos.value.x}px, ${buttonPos.value.y}px)`,
              },
            },
            [
              h('p', { style: { margin: 0 } }, '👇 Drag this button with mouse or touch!'),
              h(
                'button',
                {
                  ref: targetElement,
                  onMousedown: handleDragStart,
                  onTouchstart: handleDragStart,
                  style: {
                    padding: '10px 20px',
                    background: '#1f7acb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isDragging.value ? 'grabbing' : 'grab',
                    fontSize: '16px',
                    touchAction: 'none',
                    userSelect: 'none',
                  },
                },
                'Move me! 🎯',
              ),
            ],
          ),
          h(Taskin, {
            variant: args.variant,
            mood: 'neutral' as TaskinMood,
            size: 200,
            idleAnimation: true,
            animationsEnabled: true,
            eyeTrackingMode: 'element' as const,
            eyeTargetElement: targetElement.value,
          }),
        ],
      );
  },
  parameters: {
    docs: {
      description: {
        story: 'Taskin with eyes following a specific HTML element (the button above).',
      },
    },
  },
};

export const EyeTrackingCustomPosition: Story = {
  render: (args) =>
    // Options API com `this`: defineComponent e o que o tipa, sem cast manual
    defineComponent({
      components: { Taskin },
      template: `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin-bottom: 10px;">Click anywhere in the box below to set eye target position</p>
          <div
            ref="container"
            @click="setTargetPosition"
            style="width: 400px; height: 300px; border: 2px dashed #1f7acb; position: relative; cursor: crosshair; display: flex; align-items: center; justify-content: center; background: #f5f5f5;"
          >
            <div
              v-if="customPosition && visualIndicator"
              style="position: absolute; width: 10px; height: 10px; background: red; border-radius: 50%; pointer-events: none;"
              :style="{ left: visualIndicator.x + 'px', top: visualIndicator.y + 'px', transform: 'translate(-5px, -5px)' }"
            ></div>
            <Taskin
              mood="neutral"
              :size="150"
              :variant="variant"
              eye-tracking-mode="custom"
              :eye-custom-position="customPosition"
            />
          </div>
        </div>
      </div>
    `,
      data() {
        return {
          variant: args.variant,
          customPosition: null as { x: number; y: number } | null,
          visualIndicator: null as { x: number; y: number } | null,
        };
      },
      methods: {
        setTargetPosition(event: MouseEvent): void {
          const rect = (this.$refs.container as HTMLElement).getBoundingClientRect();
          // A posição customizada deve ser absoluta na viewport
          this.customPosition = {
            x: event.clientX,
            y: event.clientY,
          };
          // O indicador visual é relativo ao container
          this.visualIndicator = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
        },
      },
    }),
  parameters: {
    docs: {
      description: {
        story: 'Taskin with eyes following a custom position. Click anywhere in the box to set the target position.',
      },
    },
  },
};
