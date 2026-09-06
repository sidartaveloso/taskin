import { FaceTrackingDebug, TrackingControls, usePoseLandmarker, WebcamVideo } from '@opentask/ui-sense';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ArmPosition, TaskinArmsProps } from './TaskinArms.types';
import { armPosition, armPositionFromPose } from './TaskinArms.types';
import TaskinArms from './TaskinArms.vue';

const meta = {
  title: 'Atoms/TaskinArms',
  component: TaskinArms,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'color' },
      description: 'Color of the arms',
    },
  },
  render: (args: TaskinArmsProps) => ({
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
          left: armPosition(-60, -105),
          right: armPosition(-60, -105),
        },
        {
          name: 'Relaxed (Default)',
          color: '#1f7acb',
          left: armPosition(35, 5),
          right: armPosition(35, 5),
        },
        {
          name: 'Down',
          color: '#9D6BFF',
          left: armPosition(60, -90),
          right: armPosition(60, -90),
        },
        {
          name: 'Straight Out',
          color: '#6BFF9D',
          left: armPosition(0, 0),
          right: armPosition(0, 0),
        },
        {
          name: 'Wide Open',
          color: '#FFD700',
          left: armPosition(-15, -15),
          right: armPosition(-15, -15),
        },
        {
          name: 'Waving',
          color: '#FFB66B',
          left: armPosition(-80, -110),
          right: armPosition(-80, -110),
        },
        {
          name: 'Asymmetric',
          color: '#2C3E50',
          left: armPosition(-70, -130),
          right: armPosition(45, -75),
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
        story: 'Overview of all available arm position variations with different colors.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    color: '#FF6B9D',
  },
};

export const CustomColor: Story = {
  args: {
    color: '#1f7acb',
  },
};

export const AnimationsDisabled: Story = {
  args: {
    color: '#FF6B9D',
  },
};

// Arm Position Variations
export const ArmsRaised: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: armPosition(-60, -105),
    rightArmPosition: armPosition(-60, -105),
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
    leftArmPosition: armPosition(60, -90),
    rightArmPosition: armPosition(60, -90),
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
    leftArmPosition: armPosition(0, 0),
    rightArmPosition: armPosition(0, 0),
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms stretched straight out to the sides - T-pose with fully extended arms.',
      },
    },
  },
};

export const ArmsWideOpen: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: armPosition(-15, -15),
    rightArmPosition: armPosition(-15, -15),
  },
  parameters: {
    docs: {
      description: {
        story: 'Arms wide open and slightly raised - welcoming gesture with fully extended arms.',
      },
    },
  },
};

export const ArmsAsymmetric: Story = {
  args: {
    color: '#FF6B9D',
    leftArmPosition: armPosition(-70, -130),
    rightArmPosition: armPosition(45, -75),
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
    leftArmPosition: armPosition(-80, -110),
    rightArmPosition: armPosition(-80, -110),
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
    leftArmPosition: armPosition(-10, -100),
    rightArmPosition: armPosition(10, -80),
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
    leftArmPosition: armPosition(35, 5),
    rightArmPosition: armPosition(35, 5),
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
          left: armPosition(-60, -105),
          right: armPosition(-60, -105),
        },
        {
          name: 'Relaxed',
          left: armPosition(35, 5),
          right: armPosition(35, 5),
        },
        {
          name: 'Down',
          left: armPosition(60, -90),
          right: armPosition(60, -90),
        },
        {
          name: 'Straight Out',
          left: armPosition(0, 0),
          right: armPosition(0, 0),
        },
        {
          name: 'Wide Open',
          left: armPosition(-15, -15),
          right: armPosition(-15, -15),
        },
        {
          name: 'Waving',
          left: armPosition(-80, -110),
          right: armPosition(-80, -110),
        },
        {
          name: 'Asymmetric',
          left: armPosition(-70, -130),
          right: armPosition(45, -75),
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
      const leftArmPosition = ref<ArmPosition>(armPosition(35, 5));
      const rightArmPosition = ref<ArmPosition>(armPosition(35, 5));

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

            leftArmPosition.value = armPositionFromPose(armAngles.left, 'left');
            rightArmPosition.value = armPositionFromPose(armAngles.right, 'right');
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
            shoulder: `${armAngles?.left.shoulder.toFixed(2)}°`,
            elbow: `${armAngles?.left.elbow.toFixed(2)}°`,
            wrist: `${armAngles?.left.wrist.toFixed(2)}°`,
          },
          rightArm: {
            shoulder: `${armAngles?.right.shoulder.toFixed(2)}°`,
            elbow: `${armAngles?.right.elbow.toFixed(2)}°`,
            wrist: `${armAngles?.right.wrist.toFixed(2)}°`,
          },
          headTilt: `${headTilt.toFixed(2)}°`,
          torsoTilt: `${torsoTilt.toFixed(2)}°`,
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
            h(TrackingControls, {
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
