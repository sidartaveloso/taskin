// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import { usePoseLandmarker } from '../../../composables/use-pose-landmarker';
import type { ArmPosition } from '../../atoms/taskin-arms/taskin-arms.types';
import { NEUTRAL_ARM_POSITION } from '../../atoms/taskin-arms/taskin-arms.types';
import TaskinArms from '../../atoms/taskin-arms/taskin-arms.vue';
import TaskinBody from '../../atoms/taskin-body/taskin-body.vue';
import TaskinEyes from '../../atoms/taskin-eyes/taskin-eyes.vue';
import type { MouthExpression } from '../../atoms/taskin-mouth/taskin-mouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/taskin-mouth.vue';
import WebcamVideo from '../../atoms/webcam-video/webcam-video.vue';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';

const meta = {
  title: 'Organisms/Taskin/Full Tracking',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullTracking: Story = {
  render: () => ({
    setup() {
      const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
      const videoElement = ref<HTMLVideoElement | null>(null);
      const showWebcam = ref(false);

      // Sync controls
      const syncEyes = ref(true);
      const syncMouth = ref(true);
      const syncArms = ref(true);

      // Face tracking state
      const eyeState = ref<'normal' | 'closed' | 'squint' | 'wide'>('normal');
      const eyeLookPosition = ref({ x: 0, y: 0 });
      const mouthExpression = ref<MouthExpression>('neutral');

      // Pose tracking state
      const leftArmPosition = ref<ArmPosition>(NEUTRAL_ARM_POSITION);
      const rightArmPosition = ref<ArmPosition>(NEUTRAL_ARM_POSITION);

      onMounted(() => {
        if (webcamVideoRef.value) {
          videoElement.value = webcamVideoRef.value.videoElement;
        }
      });

      // Initialize face tracking
      const faceLandmarker = useFaceLandmarker(videoElement, {
        enableBlendshapes: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        mirrorEyeTracking: true,
      });

      // Initialize pose tracking
      const poseLandmarker = usePoseLandmarker(videoElement, {
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        mirrorPose: true,
      });

      const toggleTracking = () => {
        if (faceLandmarker.state.value.isDetecting) {
          faceLandmarker.stopDetection();
          poseLandmarker.stopDetection();
        } else {
          faceLandmarker.startDetection();
          poseLandmarker.startDetection();
        }
      };

      // Watch for face tracking updates
      const unwatchFace = ref<(() => void) | null>(null);

      onMounted(() => {
        unwatchFace.value = watch(
          () => faceLandmarker.state.value.blendShapes,
          (blendShapes) => {
            if (!blendShapes) return;

            // Update eyes
            if (syncEyes.value) {
              const eyeOpenness = faceLandmarker.getEyeOpenness();
              const avgOpenness = (eyeOpenness.left + eyeOpenness.right) / 2;

              // Map openness to eye state
              if (avgOpenness < 0.2) {
                eyeState.value = 'closed';
              } else if (avgOpenness < 0.5) {
                eyeState.value = 'squint';
              } else if (avgOpenness > 0.9) {
                eyeState.value = 'wide';
              } else {
                eyeState.value = 'normal';
              }

              // Update eye look direction
              eyeLookPosition.value = faceLandmarker.getEyeLookDirection();
            } // Update mouth
            if (syncMouth.value) {
              const mouthOpenness = faceLandmarker.getMouthOpenness();
              const smileIntensity = faceLandmarker.getSmileIntensity();
              const frownIntensity = faceLandmarker.getFrownIntensity();

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
            }
          },
        );
      });

      // Watch for pose tracking updates
      const unwatchPose = ref<(() => void) | null>(null);

      onMounted(() => {
        unwatchPose.value = watch(
          () => poseLandmarker.state.value.landmarks,
          (landmarks) => {
            if (!landmarks || !syncArms.value) return;

            const armAngles = poseLandmarker.getArmAngles();
            if (!armAngles) return;

            leftArmPosition.value = {
              shoulderAngle: armAngles.left.shoulder,
              elbowAngle: armAngles.left.elbow,
              wristAngle: armAngles.left.wrist,
            };

            rightArmPosition.value = {
              shoulderAngle: armAngles.right.shoulder,
              elbowAngle: armAngles.right.elbow,
              wristAngle: armAngles.right.wrist,
            };
          },
        );
      });

      onUnmounted(() => {
        if (unwatchFace.value) unwatchFace.value();
        if (unwatchPose.value) unwatchPose.value();
        faceLandmarker.stopDetection();
        poseLandmarker.stopDetection();
      });

      const debugInfo = computed(() => {
        const faceData = faceLandmarker.state.value.blendShapes
          ? {
              eyeState: eyeState.value,
              eyeLook: `${eyeLookPosition.value.x.toFixed(0)},${eyeLookPosition.value.y.toFixed(0)}`,
              mouth: mouthExpression.value,
            }
          : null;

        const armAngles = poseLandmarker.getArmAngles();
        const poseData = armAngles
          ? {
              leftShoulder: armAngles.left.shoulder.toFixed(1) + '°',
              rightShoulder: armAngles.right.shoulder.toFixed(1) + '°',
            }
          : null;

        return faceData && poseData
          ? {
              ...faceData,
              ...poseData,
            }
          : null;
      });

      const isDetecting = computed(
        () =>
          faceLandmarker.state.value.isDetecting ||
          poseLandmarker.state.value.isDetecting,
      );

      const trackingError = computed(
        () =>
          faceLandmarker.state.value.error || poseLandmarker.state.value.error,
      );

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
              isDetecting: isDetecting.value,
              error: trackingError.value,
              showWebcam: showWebcam.value,
              syncEyes: syncEyes.value,
              syncMouth: syncMouth.value,
              syncExpressions: false,
              syncArms: syncArms.value,
              disabled: trackingError.value !== null,
              'onToggle-tracking': toggleTracking,
              'onUpdate:showWebcam': (value: boolean) => {
                showWebcam.value = value;
              },
              'onUpdate:syncEyes': (value: boolean) => {
                syncEyes.value = value;
              },
              'onUpdate:syncMouth': (value: boolean) => {
                syncMouth.value = value;
              },
              'onUpdate:syncArms': (value: boolean) => {
                syncArms.value = value;
              },
            }),
            // Taskin completo com tracking
            h(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 320 200',
                width: '640',
                height: '400',
                style: {
                  border: '2px solid #e0e0e0',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                },
              },
              [
                h(TaskinBody),
                h(TaskinArms, {
                  leftArmPosition: leftArmPosition.value,
                  rightArmPosition: rightArmPosition.value,
                }),
                h(TaskinEyes, {
                  state: eyeState.value,
                  trackingMode: syncEyes.value ? 'custom' : 'none',
                  customPosition: eyeLookPosition.value,
                }),
                h(TaskinMouth, {
                  expression: mouthExpression.value,
                }),
              ],
            ),
            h(FaceTrackingDebug, {
              data: debugInfo.value,
              title: 'Full Tracking (Face + Pose)',
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
          '🎥 Complete Taskin tracking! Face controls eyes & mouth, pose controls arms. Click "Iniciar Detecção" to start.',
      },
    },
  },
};
