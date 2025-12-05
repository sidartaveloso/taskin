// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';
import WebcamVideo from '../webcam-video';
import type { MouthExpression } from './taskin-mouth.types';
import TaskinMouth from './taskin-mouth.vue';

const meta = {
  title: 'Atoms/TaskinMouth',
  component: TaskinMouth,
  tags: ['autodocs'],
  argTypes: {
    expression: {
      control: { type: 'select' },
      options: [
        'neutral',
        'smile',
        'frown',
        'open',
        'wide-open',
        'o-shape',
        'smirk',
        'surprised',
      ],
      description: 'Mouth expression',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
      description: 'Enable/disable animations',
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
          [h(TaskinMouth, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinMouth>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations: Array<{ name: string; expression: MouthExpression }> = [
        { name: 'Neutral', expression: 'neutral' },
        { name: 'Smile', expression: 'smile' },
        { name: 'Frown', expression: 'frown' },
        { name: 'Open', expression: 'open' },
        { name: 'Wide Open', expression: 'wide-open' },
        { name: 'O Shape', expression: 'o-shape' },
        { name: 'Smirk', expression: 'smirk' },
        { name: 'Surprised', expression: 'surprised' },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              padding: '1rem',
            },
          },
          variations.map((variant) =>
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
                  [h(TaskinMouth, { expression: variant.expression })],
                ),
              ],
            ),
          ),
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available mouth expressions.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    expression: 'neutral',
    animationsEnabled: true,
  },
};

export const Smile: Story = {
  args: {
    expression: 'smile',
    animationsEnabled: true,
  },
};

export const Frown: Story = {
  args: {
    expression: 'frown',
    animationsEnabled: true,
  },
};

export const Open: Story = {
  args: {
    expression: 'open',
    animationsEnabled: true,
  },
};

export const WideOpen: Story = {
  args: {
    expression: 'wide-open',
    animationsEnabled: true,
  },
};

export const OShape: Story = {
  args: {
    expression: 'o-shape',
    animationsEnabled: true,
  },
};

export const Smirk: Story = {
  args: {
    expression: 'smirk',
    animationsEnabled: true,
  },
};

export const Surprised: Story = {
  args: {
    expression: 'surprised',
    animationsEnabled: true,
  },
};

// Face Tracking Story
export const FaceTracking: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const mouthContainerRef = ref<HTMLDivElement | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(false);
      const syncMouth = ref(true);
      const mouthExpression = ref<MouthExpression>('neutral');

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

      // Watch para sincronização da boca
      const unwatchBlendShapes = ref<(() => void) | null>(null);

      onMounted(() => {
        unwatchBlendShapes.value = watch(
          () => faceLandmarker.state.value.blendShapes,
          (blendShapes) => {
            if (!blendShapes) {
              return;
            }

            // Se não está sincronizando, mantém o valor atual (congelado)
            if (!syncMouth.value) {
              return;
            }

            const mouthOpenness = faceLandmarker.getMouthOpenness();
            const smileIntensity = faceLandmarker.getSmileIntensity();
            const frownIntensity = faceLandmarker.getFrownIntensity();

            // Mapeamento baseado em thresholds
            if (mouthOpenness > 0.7) {
              mouthExpression.value = 'wide-open';
            } else if (mouthOpenness > 0.4) {
              mouthExpression.value = 'open';
            } else if (mouthOpenness > 0.2) {
              mouthExpression.value = 'o-shape';
            } else if (smileIntensity > 0.5) {
              mouthExpression.value = 'smile';
            } else if (smileIntensity > 0.3) {
              mouthExpression.value = 'smirk';
            } else if (frownIntensity > 0.3) {
              mouthExpression.value = 'frown';
            } else if (mouthOpenness > 0.15) {
              mouthExpression.value = 'surprised';
            } else {
              mouthExpression.value = 'neutral';
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

        const mouthOpenness = faceLandmarker.getMouthOpenness();
        const smileIntensity = faceLandmarker.getSmileIntensity();
        const frownIntensity = faceLandmarker.getFrownIntensity();

        return {
          mouthOpenness:
            (mouthOpenness >= 0 ? '+' : '') + mouthOpenness.toFixed(10),
          smileIntensity:
            (smileIntensity >= 0 ? '+' : '') + smileIntensity.toFixed(10),
          frownIntensity:
            (frownIntensity >= 0 ? '+' : '') + frownIntensity.toFixed(10),
          mouthExpression: mouthExpression.value,
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
              syncEyes: false,
              syncMouth: syncMouth.value,
              syncExpressions: false,
              disabled: faceLandmarker.state.value.error !== null,
              'onToggle-tracking': toggleTracking,
              'onUpdate:showWebcam': (value: boolean) => {
                showWebcam.value = value;
              },
              'onUpdate:syncMouth': (value: boolean) => {
                syncMouth.value = value;
              },
            }),
            h(
              'div',
              {
                ref: mouthContainerRef,
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
                  h(TaskinMouth, {
                    expression: mouthExpression.value,
                  }),
                ],
              ),
            ),
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Mouth Tracking',
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
          '📹 Mouth tracks your face expressions using webcam! Click "Iniciar Detecção" to start.',
      },
    },
  },
};
