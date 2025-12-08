<template>
  <div class="taskin-full-tracking">
    <!-- Webcam -->
    <WebcamVideo
      ref="webcamVideoRef"
      :visible="showWebcam"
      :width="320"
      :height="240"
      :mirrored="true"
    />

    <!-- Controles -->
    <FaceTrackingControls
      :is-detecting="isDetecting"
      :error="trackingError"
      :show-webcam="showWebcam"
      :sync-eyes="syncEyes"
      :sync-mouth="syncMouth"
      :sync-expressions="false"
      :sync-arms="syncArms"
      :disabled="trackingError !== null"
      @toggle-tracking="toggleTracking"
      @update:show-webcam="showWebcam = $event"
      @update:sync-eyes="syncEyes = $event"
      @update:sync-mouth="syncMouth = $event"
      @update:sync-arms="syncArms = $event"
    />

    <!-- Taskin Mascot -->
    <div class="mascot-container" ref="mascotContainer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 200"
        :width="mascotSize * 2"
        :height="mascotSize * 1.25"
        style="
          border: 2px solid #e0e0e0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
        "
      >
        <TaskinBody />
        <TaskinArms
          :left-arm-position="leftArmPosition"
          :right-arm-position="rightArmPosition"
        />
        <TaskinEyes
          :state="eyeState"
          :tracking-mode="eyeTrackingMode"
          :custom-position="eyePosition"
        />
        <TaskinMouth :expression="mouthExpression" />
      </svg>
    </div>

    <!-- Debug Info -->
    <FaceTrackingDebug
      v-if="showDebug"
      :data="debugInfo"
      title="Full Tracking (Face + Pose)"
      position="top-right"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useFaceLandmarker } from '../../../composables/use-face-landmarker';
import { usePoseLandmarker } from '../../../composables/use-pose-landmarker';
import type { ArmPosition } from '../../atoms/taskin-arms/taskin-arms.types';
import { NEUTRAL_ARM_POSITION } from '../../atoms/taskin-arms/taskin-arms.types';
import TaskinArms from '../../atoms/taskin-arms/taskin-arms.vue';
import TaskinBody from '../../atoms/taskin-body/taskin-body.vue';
import TaskinEyes from '../../atoms/taskin-eyes/taskin-eyes.vue';
import type { MouthExpression } from '../../atoms/taskin-mouth/taskin-mouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/taskin-mouth.vue';
import WebcamVideo from '../../atoms/webcam-video';
import FaceTrackingControls from '../../molecules/face-tracking-controls';
import FaceTrackingDebug from '../../molecules/face-tracking-debug';

export interface Props {
  mascotSize?: number;
  showWebcam?: boolean;
  showDebug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mascotSize: 320,
  showWebcam: false,
  showDebug: false,
});

// Refs
const webcamVideoRef = ref<InstanceType<typeof WebcamVideo> | null>(null);
const mascotContainer = ref<HTMLDivElement | null>(null);
const showWebcam = ref(props.showWebcam);
const syncEyes = ref(true);
const syncMouth = ref(true);
const syncArms = ref(true);

// Video element do WebcamVideo
const videoElement = ref<HTMLVideoElement | null>(null);

// Após montar, obtém a referência do vídeo
onMounted(() => {
  if (webcamVideoRef.value) {
    videoElement.value = webcamVideoRef.value.videoElement;
  }
});

// Face Landmarker
const faceLandmarker = useFaceLandmarker(videoElement, {
  enableBlendshapes: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  mirrorEyeTracking: true,
});

// Pose Landmarker
const poseLandmarker = usePoseLandmarker(videoElement, {
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  mirrorPose: true,
});

// Estado do Taskin - Face
const eyeTrackingMode = ref<'none' | 'mouse' | 'element' | 'custom'>('none');
const eyePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const eyeState = ref<'normal' | 'closed' | 'squint' | 'wide'>('normal');
const mouthExpression = ref<MouthExpression>('neutral');

// Estado do Taskin - Pose
const leftArmPosition = ref<ArmPosition>(NEUTRAL_ARM_POSITION);
const rightArmPosition = ref<ArmPosition>(NEUTRAL_ARM_POSITION);

// Controle combinado
const isDetecting = computed(
  () =>
    faceLandmarker.state.value.isDetecting ||
    poseLandmarker.state.value.isDetecting,
);

const trackingError = computed(
  () => faceLandmarker.state.value.error || poseLandmarker.state.value.error,
);

const toggleTracking = () => {
  if (faceLandmarker.state.value.isDetecting) {
    faceLandmarker.stopDetection();
    poseLandmarker.stopDetection();
  } else {
    faceLandmarker.startDetection();
    poseLandmarker.startDetection();
  }
};

// Watch para syncEyes
watch(syncEyes, (enabled) => {
  if (enabled && faceLandmarker.state.value.isDetecting) {
    eyeTrackingMode.value = 'custom';
  } else {
    eyeTrackingMode.value = 'none';
  }
});

// Sincronização dos olhos
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes || !mascotContainer.value) {
      return;
    }

    // Olhos
    if (syncEyes.value) {
      eyeTrackingMode.value = 'custom';

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

      // Eye look direction
      const eyeLook = faceLandmarker.getEyeLookDirection();
      const mascotRect = mascotContainer.value.getBoundingClientRect();
      const mascotCenterX = mascotRect.left + mascotRect.width / 2;
      const mascotCenterY = mascotRect.top + mascotRect.height / 2;

      eyePosition.value = {
        x: mascotCenterX + eyeLook.x,
        y: mascotCenterY + eyeLook.y,
      };
    }

    // Boca
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

// Sincronização dos braços
watch(
  () => poseLandmarker.state.value.landmarks,
  (landmarks) => {
    if (!landmarks || !syncArms.value) {
      return;
    }

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

// Debug info
const debugInfo = computed(() => {
  const faceData = faceLandmarker.state.value.blendShapes
    ? {
        eyeState: eyeState.value,
        eyeLook: `${eyePosition.value.x.toFixed(0)},${eyePosition.value.y.toFixed(0)}`,
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

// Cleanup
onUnmounted(() => {
  faceLandmarker.stopDetection();
  poseLandmarker.stopDetection();
});
</script>

<style scoped>
.taskin-full-tracking {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.mascot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}
</style>
