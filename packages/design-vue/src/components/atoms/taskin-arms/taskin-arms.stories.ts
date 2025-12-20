// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { usePoseLandmarker } from '../../../composables/use-pose-landmarker';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';
import WebcamVideo from '../webcam-video';
import type { ArmPosition } from './taskin-arms.types';
import TaskinArms from './taskin-arms.vue';

const meta = {
  title: 'Atoms/TaskinArms',
  component: TaskinArms,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'color' },
      description: 'Color of the arms',
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
          [h(TaskinArms, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinArms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        {
          name: 'Raised',
          color: '#FF6B9D',
          left: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
          right: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
        },
        {
          name: 'Relaxed (Default)',
          color: '#1f7acb',
          left: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
          right: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
        },
        {
          name: 'Down',
          color: '#9D6BFF',
          left: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
          right: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
        },
        {
          name: 'Straight Out',
          color: '#6BFF9D',
          left: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
          right: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
        },
        {
          name: 'Wide Open',
          color: '#FFD700',
          left: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
          right: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
        },
        {
          name: 'Waving',
          color: '#FFB66B',
          left: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
          right: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
        },
        {
          name: 'Asymmetric',
          color: '#2C3E50',
          left: { shoulderAngle: -70, elbowAngle: 60, wristAngle: -30 },
          right: { shoulderAngle: 45, elbowAngle: 120, wristAngle: -60 },
        },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
                    width: '200',
                    height: '125',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [
                    h(TaskinArms, {
                      color: variant.color,
                      leftArmPosition: variant.left,
                      rightArmPosition: variant.right,
                    }),
                  ],
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
        story:
          'Overview of all available arm position variations with different colors.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    color: '#FF6B9D',
    animationsEnabled: true,
  },
};

export const CustomColor: Story = {
  args: {
    color: '#1f7acb',
    animationsEnabled: true,
  },
};

export const AnimationsDisabled: Story = {
  args: {
    color: '#FF6B9D',
    animationsEnabled: false,
  },
};

// Arm Position Variations
export const ArmsRaised: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
    rightArmPosition: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms raised up and curved, like celebrating or waving.',
      },
    },
  },
};

export const ArmsDown: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
    rightArmPosition: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms relaxed down with slight curve.',
      },
    },
  },
};

export const ArmsStraightOut: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
    rightArmPosition: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Arms stretched straight out to the sides - T-pose with fully extended arms.',
      },
    },
  },
};

export const ArmsWideOpen: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
    rightArmPosition: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Arms wide open and slightly raised - welcoming gesture with fully extended arms.',
      },
    },
  },
};

export const ArmsAsymmetric: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: -70, elbowAngle: 60, wristAngle: -30 },
    rightArmPosition: { shoulderAngle: 45, elbowAngle: 120, wristAngle: -60 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Asymmetric pose - left arm raised, right arm down.',
      },
    },
  },
};

export const ArmsWaving: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
    rightArmPosition: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms high up with strong curve, like waving enthusiastically.',
      },
    },
  },
};

export const ArmsCrossed: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: -10, elbowAngle: 90, wristAngle: -45 },
    rightArmPosition: { shoulderAngle: 10, elbowAngle: 90, wristAngle: 45 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms slightly forward and bent, suggesting a crossed pose.',
      },
    },
  },
};

export const ArmsRelaxed: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
    rightArmPosition: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default relaxed pose - arms down with gentle curve.',
      },
    },
  },
};

export const ArmPositionsGrid: Story = {
  render: () => ({
    setup() {
      const positions = [
        {
          name: 'Raised',
          left: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
          right: { shoulderAngle: -60, elbowAngle: 45, wristAngle: -45 },
        },
        {
          name: 'Relaxed',
          left: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
          right: { shoulderAngle: 35, elbowAngle: 30, wristAngle: -45 },
        },
        {
          name: 'Down',
          left: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
          right: { shoulderAngle: 60, elbowAngle: 150, wristAngle: -45 },
        },
        {
          name: 'Straight Out',
          left: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
          right: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0 },
        },
        {
          name: 'Wide Open',
          left: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
          right: { shoulderAngle: -15, elbowAngle: 0, wristAngle: 0 },
        },
        {
          name: 'Waving',
          left: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
          right: { shoulderAngle: -80, elbowAngle: 30, wristAngle: -20 },
        },
        {
          name: 'Asymmetric',
          left: { shoulderAngle: -70, elbowAngle: 60, wristAngle: -30 },
          right: { shoulderAngle: 45, elbowAngle: 120, wristAngle: -60 },
        },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
              padding: '1rem',
            },
          },
          positions.map((pos) =>
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
                h('strong', pos.name),
                h(
                  'svg',
                  {
                    xmlns: 'http://www.w3.org/2000/svg',
                    viewBox: '0 0 320 200',
                    width: '200',
                    height: '125',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [
                    h(TaskinArms, {
                      leftArmPosition: pos.left,
                      rightArmPosition: pos.right,
                    }),
                  ],
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
        story: 'Grid overview of different arm position variations.',
      },
    },
  },
};

// Pose Tracking Story
export const PoseTracking: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const armsContainerRef = ref<HTMLDivElement | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(false);
      const syncArms = ref(true);
      const leftArmPosition = ref<ArmPosition>({
        shoulderAngle: 35,
        elbowAngle: 30,
        wristAngle: -45,
      });
      const rightArmPosition = ref<ArmPosition>({
        shoulderAngle: 35,
        elbowAngle: 30,
        wristAngle: -45,
      });

      onMounted(() => {
        if (webcamVideoRef.value) {
          videoElement.value = webcamVideoRef.value.videoElement;
        }
      });

      const poseLandmarker = usePoseLandmarker(videoElement, {
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        mirrorPose: true,
      });

      const toggleTracking = () => {
        if (poseLandmarker.state.value.isDetecting) {
          poseLandmarker.stopDetection();
        } else {
          poseLandmarker.startDetection();
        }
      };

      // Watch para sincronização dos braços
      const unwatchLandmarks = ref<(() => void) | null>(null);

      onMounted(() => {
        unwatchLandmarks.value = watch(
          () => poseLandmarker.state.value.landmarks,
          (landmarks) => {
            if (!landmarks) {
              return;
            }

            // Se não está sincronizando, mantém os valores atuais (congelados)
            if (!syncArms.value) {
              return;
            }

            const armAngles = poseLandmarker.getArmAngles();
            if (!armAngles) return;

            // Debug: log arm angles
            console.log('Arm angles:', {
              left: armAngles.left,
              right: armAngles.right,
            });

            // Update left arm
            leftArmPosition.value = {
              shoulderAngle: armAngles.left.shoulder,
              elbowAngle: armAngles.left.elbow,
              wristAngle: armAngles.left.wrist,
            };

            // Update right arm
            rightArmPosition.value = {
              shoulderAngle: armAngles.right.shoulder,
              elbowAngle: armAngles.right.elbow,
              wristAngle: armAngles.right.wrist,
            };
          },
        );
      });

      onUnmounted(() => {
        if (unwatchLandmarks.value) {
          unwatchLandmarks.value();
        }
        poseLandmarker.stopDetection();
      });

      const debugInfo = computed(() => {
        const landmarks = poseLandmarker.state.value.landmarks;
        if (!landmarks) return null;

        const armAngles = poseLandmarker.getArmAngles();
        const headTilt = poseLandmarker.getHeadTilt();
        const torsoTilt = poseLandmarker.getTorsoTilt();

        return {
          leftArm: {
            shoulder: armAngles?.left.shoulder.toFixed(2) + '°',
            elbow: armAngles?.left.elbow.toFixed(2) + '°',
            wrist: armAngles?.left.wrist.toFixed(2) + '°',
          },
          rightArm: {
            shoulder: armAngles?.right.shoulder.toFixed(2) + '°',
            elbow: armAngles?.right.elbow.toFixed(2) + '°',
            wrist: armAngles?.right.wrist.toFixed(2) + '°',
          },
          headTilt: headTilt.toFixed(2) + '°',
          torsoTilt: torsoTilt.toFixed(2) + '°',
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
              isDetecting: poseLandmarker.state.value.isDetecting,
              error: poseLandmarker.state.value.error,
              showWebcam: showWebcam.value,
              syncEyes: false,
              syncMouth: false,
              syncExpressions: false,
              syncArms: syncArms.value,
              disabled: poseLandmarker.state.value.error !== null,
              'onToggle-tracking': toggleTracking,
              'onUpdate:showWebcam': (value: boolean) => {
                showWebcam.value = value;
              },
              'onUpdate:syncArms': (value: boolean) => {
                syncArms.value = value;
              },
            }),
            h(
              'div',
              {
                ref: armsContainerRef,
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
                  h(TaskinArms, {
                    leftArmPosition: leftArmPosition.value,
                    rightArmPosition: rightArmPosition.value,
                  }),
                ],
              ),
            ),
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Arms Pose Tracking',
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
          '📹 Arms track your body pose using webcam! Click "Iniciar Detecção" to start. Move your arms to see Taskin\'s arms move.',
      },
    },
  },
};
