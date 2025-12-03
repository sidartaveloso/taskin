// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h, onMounted, onUnmounted, ref } from 'vue';
import type { EyeState } from './taskin-eyes.types';
import TaskinEyes from './taskin-eyes.vue';

const meta = {
  title: 'Atoms/TaskinEyes',
  component: TaskinEyes,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: { type: 'select' },
      options: ['normal', 'closed', 'squint', 'wide'],
      description: 'Eye state/expression',
    },
    trackingMode: {
      control: { type: 'select' },
      options: ['none', 'mouse', 'element', 'custom'],
      description: 'Tracking mode',
    },
    lookDirection: {
      control: { type: 'select' },
      options: ['center', 'left', 'right', 'up', 'down'],
      description: 'Manual look direction (only when trackingMode is "none")',
      if: { arg: 'trackingMode', eq: 'none' },
    },
    animationsEnabled: {
      control: { type: 'boolean' },
      description: 'Enable/disable animations',
    },
    trackingBounds: {
      control: { type: 'range', min: 1, max: 15, step: 1 },
      description: 'Maximum pupil movement in pixels',
    },
  },
  render: (args: any) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 320 200',
            width: '320',
            height: '200',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinEyes, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinEyes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const stateVariations: Array<{ name: string; state: EyeState }> = [
        { name: 'Normal', state: 'normal' },
        { name: 'Closed', state: 'closed' },
        { name: 'Squint', state: 'squint' },
        { name: 'Wide', state: 'wide' },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              padding: '1rem',
            },
          },
          [
            h('div', [
              h('h3', { style: { marginBottom: '1rem' } }, 'Eye States'),
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                  },
                },
                stateVariations.map((variant) =>
                  h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                      },
                    },
                    [
                      h('strong', variant.name),
                      h(
                        'svg',
                        {
                          xmlns: 'http://www.w3.org/2000/svg',
                          viewBox: '0 0 320 200',
                          width: '180',
                          height: '110',
                          style: {
                            border: '1px solid #e0e0e0',
                            background: '#f5f5f5',
                          },
                        },
                        [h(TaskinEyes, { state: variant.state })],
                      ),
                    ],
                  ),
                ),
              ),
            ]),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available eye states.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    state: 'normal',
    trackingMode: 'none',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

// Mouse Tracking Stories
export const MouseTracking: Story = {
  args: {
    state: 'normal',
    trackingMode: 'mouse',
    trackingBounds: 6,
  },
  parameters: {
    docs: {
      description: {
        story: '🖱️ Move your mouse around to see the eyes follow the cursor!',
      },
    },
  },
};

export const MouseTrackingWideEyes: Story = {
  args: {
    state: 'wide',
    trackingMode: 'mouse',
    trackingBounds: 8,
  },
  parameters: {
    docs: {
      description: {
        story: '👀 Wide eyes following the mouse with larger tracking bounds.',
      },
    },
  },
};

// Element Tracking Story
export const ElementTracking: Story = {
  render: () => ({
    setup() {
      const buttonPos = ref({ x: 0, y: 0 });
      const isDragging = ref(false);
      const dragOffset = ref({ x: 0, y: 0 });

      const handleDragStart = (e: MouseEvent | TouchEvent) => {
        isDragging.value = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragOffset.value = {
          x: clientX - buttonPos.value.x,
          y: clientY - buttonPos.value.y,
        };
      };

      const handleDragMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging.value) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
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
              gap: '2rem',
              padding: '2rem',
              alignItems: 'center',
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
                  position: 'relative',
                  transform: `translate(${buttonPos.value.x}px, ${buttonPos.value.y}px)`,
                },
              },
              [
                h(
                  'p',
                  { style: { margin: 0 } },
                  '👇 Drag this button with mouse or touch!',
                ),
                h(
                  'button',
                  {
                    id: 'tracking-target',
                    style: {
                      padding: '1rem 2rem',
                      fontSize: '1.2rem',
                      cursor: isDragging.value ? 'grabbing' : 'grab',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      touchAction: 'none',
                      userSelect: 'none',
                    },
                    onMousedown: handleDragStart,
                    onTouchstart: handleDragStart,
                  },
                  'Move me! 🎯',
                ),
              ],
            ),
            h(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 320 200',
                width: '320',
                height: '200',
                style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
              },
              [
                h(TaskinEyes, {
                  state: 'normal',
                  trackingMode: 'element',
                  targetElement: '#tracking-target',
                  trackingBounds: 8,
                }),
              ],
            ),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          '🎯 Eyes track a specific element on the page. Hover over the button to see it move!',
      },
    },
  },
};

// Custom Position Tracking Story
export const CustomPositionTracking: Story = {
  render: () => ({
    setup() {
      const customPos = ref({ x: 400, y: 300 });
      let animationId: number;

      onMounted(() => {
        const animate = () => {
          const time = Date.now() / 1000;
          customPos.value = {
            x: 400 + Math.sin(time) * 200,
            y: 300 + Math.cos(time * 1.5) * 150,
          };
          animationId = requestAnimationFrame(animate);
        };
        animate();
      });

      onUnmounted(() => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      });

      return () =>
        h(
          'div',
          {
            style: {
              position: 'relative',
              width: '800px',
              height: '600px',
              background: '#f0f0f0',
              border: '2px solid #ccc',
            },
          },
          [
            h(
              'div',
              {
                style: {
                  position: 'absolute',
                  left: `${customPos.value.x}px`,
                  top: `${customPos.value.y}px`,
                  width: '20px',
                  height: '20px',
                  background: 'red',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.05s linear',
                },
              },
              '🎯',
            ),
            h(
              'div',
              {
                style: {
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                },
              },
              h(
                'svg',
                {
                  xmlns: 'http://www.w3.org/2000/svg',
                  viewBox: '0 0 320 200',
                  width: '320',
                  height: '200',
                  style: {
                    border: '1px solid #e0e0e0',
                    background: '#f5f5f5',
                  },
                },
                [
                  h(TaskinEyes, {
                    state: 'normal',
                    trackingMode: 'custom',
                    customPosition: customPos.value,
                    trackingBounds: 10,
                  }),
                ],
              ),
            ),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          '🎮 Eyes track a custom position (simulating webcam or game data). The red target moves programmatically.',
      },
    },
  },
};

// Manual Control Stories
export const LookingLeft: Story = {
  args: {
    state: 'normal',
    trackingMode: 'none',
    lookDirection: 'left',
    animationsEnabled: true,
  },
};

export const LookingRight: Story = {
  args: {
    state: 'normal',
    trackingMode: 'none',
    lookDirection: 'right',
    animationsEnabled: true,
  },
};

export const LookingUp: Story = {
  args: {
    state: 'normal',
    trackingMode: 'none',
    lookDirection: 'up',
    animationsEnabled: true,
  },
};

export const LookingDown: Story = {
  args: {
    state: 'normal',
    trackingMode: 'none',
    lookDirection: 'down',
    animationsEnabled: true,
  },
};

export const Closed: Story = {
  args: {
    state: 'closed',
    trackingMode: 'none',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const Squint: Story = {
  args: {
    state: 'squint',
    trackingMode: 'none',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const Wide: Story = {
  args: {
    state: 'wide',
    trackingMode: 'none',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};
