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
        component: [
          '## Gesto de Atalho — a evolução do atalho de teclado',
          '',
          'Assim como `⌘C`/`⌘V` eliminam a navegação por menu, **gestos de atalho** eliminam a necessidade de tocar ou clicar — sem exigir hardware especializado e com mapeamento persistente por usuário.',
          '',
          '### Por que existe',
          '',
          'O teclado é o instrumento mais rápido para um usuário avançado sentado à mesa. Mas e quando o usuário está em pé na frente de um videowall? O display é uma TV na parede da sala de reunião? É um totem em loja? O usuário simplesmente prefere comandar por gesto?',
          '',
          '### Onde pode ser aplicado',
          '',
          '| Cenário | Antes | Agora |',
          '|---------|-------|-------|',
          '| **Videowall corporativo** | Dashboard estático, ninguém interage | Gestor abre/fecha KPIs com a mão |',
          '| **TV sala de reunião** | Apresentador preso ao notebook | Navega slides com gestos, sem voltar à mesa |',
          '| **Totem de loja / quiosque** | Touch screen (sujeira, manutenção) | Comando sem contato físico |',
          '| **Linha de produção / cozinha industrial** | Mão suja não pode tocar tela | Gesto substitui o toque |',
          '| **Prioritização de tarefas** | Só atalho de teclado (`⌘↑↓`) | Mão aberta, punho, joinha — sem teclado |',
          '| **Dashboards interativos** | Mouse/teclado fixo na bancada | Navegação livre, gestos persistidos por perfil |',
          '',
          '---',
          '',
          'Este composable é a camada base: reconhece os gestos da mão via MediaPipe. Veja também `useGestureShortcuts` (mapeamento gesto→ação) e `GestureWizard` (interface de configuração).',
        ].join('\n'),
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
            confiança: (gest.score * 100).toFixed(1) + '%',
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
                    dominantGesture.value?.gesture === 'None' ||
                    !dominantGesture.value
                      ? '#f0f0f0'
                      : '#e3f2fd',
                  border: '2px solid',
                  borderColor:
                    dominantGesture.value?.gesture === 'None' ||
                    !dominantGesture.value
                      ? '#ddd'
                      : '#1f7acb',
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
                  dominantGesture.value
                    ? gestureEmoji[dominantGesture.value.gesture]
                    : gestureEmoji.None,
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
                      dominantGesture.value
                        ? gestureLabel[dominantGesture.value.gesture]
                        : 'Aguardando...',
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
          'Demonstração ao vivo do reconhecimento de gestos. Ative a câmera, faça gestos com as mãos e veja o resultado em tempo real com emoji, nome e confiança.',
          '',
          '**Gestos reconhecidos:** Punho fechado ✊, Mão aberta 🖐️, Indicador ☝️, Polegar baixo 👎, Polegar cima 👍, Vitória ✌️, Rock On 🤟.',
          '',
          'Use este demo para testar a sensibilidade da câmera, distância ideal e iluminação antes de integrar o mapeamento de atalhos.',
        ].join('\n'),
      },
    },
  },
};
