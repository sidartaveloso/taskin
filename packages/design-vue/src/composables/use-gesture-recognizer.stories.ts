import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import WebcamVideo from '../components/atoms/webcam-video/webcam-video.vue';
import FaceTrackingDebug from '../components/molecules/face-tracking-debug/face-tracking-debug.vue';
import TrackingControls from '../components/molecules/tracking-controls/tracking-controls.vue';
import type { CannedGesture } from './use-gesture-recognizer';
import { useGestureRecognizer } from './use-gesture-recognizer';

const gestureEmoji: Record<CannedGesture, string> = {
  None: '🫥',
  Closed_Fist: '✊',
  Open_Palm: '🖐️',
  Pointing_Up: '☝️',
  Thumb_Down: '👎',
  Thumb_Up: '👍',
  Victory: '✌️',
  ILoveYou: '🤟',
};

const gestureLabel: Record<CannedGesture, string> = {
  None: 'Nenhum',
  Closed_Fist: 'Punho fechado',
  Open_Palm: 'Mão aberta',
  Pointing_Up: 'Dedo indicador',
  Thumb_Down: 'Polegar baixo',
  Thumb_Up: 'Polegar cima',
  Victory: 'Paz/Vitória',
  ILoveYou: 'Rock On',
};

const meta = {
  title: 'Composables/GestureRecognizer',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Reconhecimento de gestos manuais via MediaPipe GestureRecognizer. Use esta story para testar câmera, iluminação e distância antes de integrar o GestureSystem.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const LiveDemo: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(false);

      onMounted(() => {
        if (webcamVideoRef.value) {
          videoElement.value = webcamVideoRef.value.videoElement;
        }
      });

      const gestureRecognizer = useGestureRecognizer(videoElement, {
        numHands: 2,
        gestureScoreThreshold: 0.6,
      });

      const toggleDetection = () => {
        if (gestureRecognizer.state.value.isDetecting) {
          gestureRecognizer.stopDetection();
        } else {
          gestureRecognizer.startDetection();
        }
      };

      const dominantGesture = computed(() => {
        const gest = gestureRecognizer.getDominantGesture();
        if (!gest) return null;
        return gest;
      });

      const debugInfo = computed(() => {
        const g = gestureRecognizer.state.value.gestures;
        if (g.length === 0) return null;

        const info: Record<string, unknown> = {};
        g.forEach((gest, i) => {
          info[`mão ${i + 1}`] = {
            gesto: gestureLabel[gest.gesture] || gest.gesture,
            confiança: `${(gest.score * 100).toFixed(1)}%`,
            mão: gest.handedness,
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
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              position: 'relative',
              fontFamily: 'system-ui, sans-serif',
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
            h(TrackingControls, {
              isDetecting: gestureRecognizer.state.value.isDetecting,
              error: gestureRecognizer.state.value.error,
              showWebcam: showWebcam.value,
              syncEyes: false,
              syncMouth: false,
              syncExpressions: false,
              syncArms: false,
              disabled: gestureRecognizer.state.value.error !== null,
              'onToggle-tracking': toggleDetection,
              'onUpdate:showWebcam': (value: boolean) => {
                showWebcam.value = value;
              },
            }),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '24px 40px',
                  background:
                    dominantGesture.value?.gesture === 'None' || !dominantGesture.value ? '#f0f0f0' : '#e3f2fd',
                  border: '2px solid',
                  borderColor: dominantGesture.value?.gesture === 'None' || !dominantGesture.value ? '#ddd' : '#1f7acb',
                  borderRadius: '16px',
                  minWidth: '240px',
                  justifyContent: 'center',
                },
              },
              [
                h(
                  'span',
                  {
                    style: {
                      fontSize: '64px',
                      lineHeight: 1,
                    },
                  },
                  dominantGesture.value ? gestureEmoji[dominantGesture.value.gesture] : gestureEmoji.None,
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    },
                  },
                  [
                    h(
                      'strong',
                      {
                        style: {
                          fontSize: '24px',
                          color: '#1a1a1a',
                        },
                      },
                      dominantGesture.value ? gestureLabel[dominantGesture.value.gesture] : 'Aguardando...',
                    ),
                    dominantGesture.value
                      ? h(
                          'span',
                          {
                            style: {
                              fontSize: '14px',
                              color: '#666',
                            },
                          },
                          `${(dominantGesture.value.score * 100).toFixed(1)}% confiança — ${dominantGesture.value.handedness === 'Left' ? 'Mão esquerda' : 'Mão direita'}`,
                        )
                      : h(
                          'span',
                          {
                            style: {
                              fontSize: '14px',
                              color: '#999',
                            },
                          },
                          'Clique em "Iniciar Detecção"',
                        ),
                  ],
                ),
              ],
            ),
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Gesture Recognition',
              position: 'top-right',
            }),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: [
          'Teste ao vivo do reconhecimento de gestos. Ative a câmera e veja emoji + nome + confiança do gesto detectado.',
          '',
          '**Gestos suportados:** ✊ Closed_Fist, 🖐️ Open_Palm, ☝️ Pointing_Up, 👎 Thumb_Down, 👍 Thumb_Up, ✌️ Victory, 🤟 ILoveYou.',
          '',
          '**Parâmetros configuráveis via `UseGestureRecognizerOptions`:**',
          '- `numHands` (default 2)',
          '- `minHandDetectionConfidence` (default 0.5)',
          '- `minHandPresenceConfidence` (default 0.5)',
          '- `minTrackingConfidence` (default 0.5)',
          '- `gestureScoreThreshold` (default 0.6)',
        ].join('\n'),
      },
    },
  },
};
