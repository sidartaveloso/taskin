// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';
import WebcamVideo from '../webcam-video';
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
      const containerRef = ref<HTMLDivElement | null>(null);
      const customPos = ref({ x: 400, y: 300 });
      const absolutePos = ref({ x: 0, y: 0 });
      let animationId: number;

      onMounted(() => {
        const animate = () => {
          const time = Date.now() / 1000;
          const relativeX = 400 + Math.sin(time) * 200;
          const relativeY = 300 + Math.cos(time * 1.5) * 150;

          customPos.value = { x: relativeX, y: relativeY };

          // Converte para coordenadas absolutas da viewport
          if (containerRef.value) {
            const containerRect = containerRef.value.getBoundingClientRect();
            absolutePos.value = {
              x: containerRect.left + relativeX,
              y: containerRect.top + relativeY,
            };
          }

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
            ref: containerRef,
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
                    customPosition: absolutePos.value,
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

// Face Tracking Story
export const FaceTracking: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const eyesContainerRef = ref<HTMLDivElement | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(false);
      const syncEyes = ref(true);
      const eyeTrackingMode = ref<'none' | 'mouse' | 'element' | 'custom'>(
        'none',
      );
      const eyeState = ref<EyeState>('normal');
      const eyePosition = ref({ x: 0, y: 0 });

      onMounted(() => {
        if (webcamVideoRef.value) {
          videoElement.value = webcamVideoRef.value.videoElement;
        }
      });

      const faceLandmarker = useFaceLandmarker(videoElement, {
        enableBlendshapes: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        mirrorEyeTracking: true,
      });

      const toggleTracking = () => {
        if (faceLandmarker.state.value.isDetecting) {
          faceLandmarker.stopDetection();
        } else {
          faceLandmarker.startDetection();
        }
      };

      // Watch para syncEyes - garante que o tracking mode seja mantido
      watch(syncEyes, (enabled) => {
        if (enabled && faceLandmarker.state.value.isDetecting) {
          eyeTrackingMode.value = 'custom';
        }
      });

      // Sincronização dos olhos
      const unwatchBlendShapes = ref<(() => void) | null>(null);

      onMounted(() => {
        unwatchBlendShapes.value = watch(
          () => faceLandmarker.state.value.blendShapes,
          (blendShapes) => {
            if (!blendShapes || !eyesContainerRef.value) {
              return;
            }

            // Se não está sincronizando, mantém os valores atuais (congelados)
            if (!syncEyes.value) {
              return;
            }

            eyeTrackingMode.value = 'custom';

            // Movimento dos olhos
            const eyeLook = faceLandmarker.getEyeLookDirection();
            const eyesRect = eyesContainerRef.value.getBoundingClientRect();
            const eyesCenterX = eyesRect.left + eyesRect.width / 2;
            const eyesCenterY = eyesRect.top + eyesRect.height / 2;

            eyePosition.value = {
              x: eyesCenterX + eyeLook.x * 2,
              y: eyesCenterY + eyeLook.y * 2,
            };

            // Estado dos olhos
            const eyeOpenness = faceLandmarker.getEyeOpenness();
            const avgOpenness = (eyeOpenness.left + eyeOpenness.right) / 2;

            if (faceLandmarker.isEyesWide()) {
              eyeState.value = 'wide';
            } else if (avgOpenness < 0.3) {
              eyeState.value = 'closed';
            } else if (avgOpenness < 0.6) {
              eyeState.value = 'squint';
            } else {
              eyeState.value = 'normal';
            }
          },
        );
      });

      onUnmounted(() => {
        if (unwatchBlendShapes.value) {
          unwatchBlendShapes.value();
        }
        faceLandmarker.stopDetection();
      });

      const debugInfo = computed(() => {
        const bs = faceLandmarker.state.value.blendShapes;
        if (!bs) return null;

        const eyeLook = faceLandmarker.getEyeLookDirection();
        const eyeOpenness = faceLandmarker.getEyeOpenness();
        return {
          eyeLook: {
            x: (eyeLook.x >= 0 ? '+' : '') + eyeLook.x.toFixed(15),
            y: (eyeLook.y >= 0 ? '+' : '') + eyeLook.y.toFixed(15),
          },
          eyeOpenness: {
            left:
              (eyeOpenness.left >= 0 ? '+' : '') + eyeOpenness.left.toFixed(10),
            right:
              (eyeOpenness.right >= 0 ? '+' : '') +
              eyeOpenness.right.toFixed(10),
          },
          eyeState: eyeState.value,
        };
      });

      return () =>
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              position: 'relative',
            },
          },
          [
            h(WebcamVideo, {
              ref: webcamVideoRef,
              visible: showWebcam.value,
              width: 320,
              height: 240,
              mirrored: true,
            }),
            h(FaceTrackingControls, {
              isDetecting: faceLandmarker.state.value.isDetecting,
              error: faceLandmarker.state.value.error,
              showWebcam: showWebcam.value,
              syncEyes: syncEyes.value,
              syncMouth: false,
              syncExpressions: false,
              disabled: faceLandmarker.state.value.error !== null,
              'onToggle-tracking': toggleTracking,
              'onUpdate:showWebcam': (value: boolean) => {
                showWebcam.value = value;
              },
              'onUpdate:syncEyes': (value: boolean) => {
                syncEyes.value = value;
              },
            }),
            h(
              'div',
              {
                ref: eyesContainerRef,
                style: {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
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
                    state: eyeState.value,
                    trackingMode: eyeTrackingMode.value,
                    customPosition: eyePosition.value,
                    trackingBounds: 8,
                  }),
                ],
              ),
            ),
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Eyes Tracking',
              position: 'top-right',
            }),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          '📹 Eyes track your face using webcam! Click "Iniciar Detecção" to start.',
      },
    },
  },
};
