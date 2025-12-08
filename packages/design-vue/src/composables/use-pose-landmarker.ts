import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { onUnmounted, ref, type Ref } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PoseLandmarkerInstance = any;

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseLandmarkerResult {
  landmarks: PoseLandmark[][];
  worldLandmarks?: PoseLandmark[][];
}

export interface ArmAngles {
  left: {
    shoulder: number;
    elbow: number;
    wrist: number;
  };
  right: {
    shoulder: number;
    elbow: number;
    wrist: number;
  };
}

export interface PoseLandmarkerState {
  isReady: boolean;
  isDetecting: boolean;
  error: string | null;
  landmarks: PoseLandmark[] | null;
  worldLandmarks: PoseLandmark[] | null;
}

export interface UsePoseLandmarkerOptions {
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  mirrorPose?: boolean;
}

// MediaPipe Pose Landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export function usePoseLandmarker(
  videoElement: Ref<HTMLVideoElement | null>,
  options: UsePoseLandmarkerOptions = {},
) {
  const {
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
    mirrorPose = true,
  } = options;

  const poseLandmarker = ref<PoseLandmarkerInstance | null>(null);
  const state = ref<PoseLandmarkerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    landmarks: null,
    worldLandmarks: null,
  });

  let animationFrameId: number | null = null;
  let stream: MediaStream | null = null;

  // Start webcam
  const startWebcam = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoElement.value) {
        videoElement.value.srcObject = stream;
        // Aguarda o vídeo estar pronto antes de dar play
        await new Promise<void>((resolve) => {
          if (videoElement.value) {
            videoElement.value.onloadedmetadata = () => {
              resolve();
            };
          }
        });
        await videoElement.value.play();
      }
    } catch (error) {
      state.value.error = `Failed to access webcam: ${error}`;
      console.error('Webcam access error:', error);
    }
  };

  // Initialize MediaPipe Pose Landmarker
  const initialize = async () => {
    try {
      state.value.error = null;

      // Close existing instance if any
      if (poseLandmarker.value) {
        poseLandmarker.value.close();
        poseLandmarker.value = null;
      }

      console.log('Initializing MediaPipe Pose Landmarker...');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
      );

      console.log('Creating PoseLandmarker with IMAGE mode...');

      // Create with IMAGE mode (mais estável para detecção frame-by-frame)
      poseLandmarker.value = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: minDetectionConfidence,
        minPosePresenceConfidence: minDetectionConfidence,
        minTrackingConfidence: minTrackingConfidence,
      });

      state.value.isReady = true;
      console.log('PoseLandmarker initialized successfully with IMAGE mode!');
    } catch (error) {
      state.value.error = `Failed to initialize pose landmarker: ${error}`;
      console.error(state.value.error);
    }
  };

  // Detect pose in video frame
  const detectPose = () => {
    // Multiple safety checks
    if (!state.value.isDetecting) {
      return;
    }

    if (!state.value.isReady) {
      console.warn('Pose landmarker not ready yet, skipping frame');
      animationFrameId = requestAnimationFrame(detectPose);
      return;
    }

    if (!poseLandmarker.value) {
      console.error('Pose landmarker instance is null');
      stopDetection();
      state.value.error = 'Pose landmarker instance lost';
      return;
    }

    if (!videoElement.value) {
      animationFrameId = requestAnimationFrame(detectPose);
      return;
    }

    const video = videoElement.value;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId = requestAnimationFrame(detectPose);
      return;
    }

    try {
      // Usar detect() em vez de detectForVideo() para IMAGE mode
      const result: PoseLandmarkerResult = poseLandmarker.value.detect(video);

      if (result.landmarks && result.landmarks.length > 0) {
        let landmarks = result.landmarks[0];

        // Se mirrorPose está ativo, espelhar os landmarks horizontalmente
        if (mirrorPose) {
          // Primeiro espelha as coordenadas X
          landmarks = landmarks.map((landmark) => ({
            ...landmark,
            x: 1 - landmark.x, // Inverte coordenada X (espelha horizontalmente)
          }));

          // Depois troca os landmarks LEFT ↔ RIGHT
          const mirrored = [...landmarks];

          // Trocar olhos
          [
            mirrored[POSE_LANDMARKS.LEFT_EYE_INNER],
            mirrored[POSE_LANDMARKS.RIGHT_EYE_INNER],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_EYE_INNER],
            mirrored[POSE_LANDMARKS.LEFT_EYE_INNER],
          ];
          [
            mirrored[POSE_LANDMARKS.LEFT_EYE],
            mirrored[POSE_LANDMARKS.RIGHT_EYE],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_EYE],
            mirrored[POSE_LANDMARKS.LEFT_EYE],
          ];
          [
            mirrored[POSE_LANDMARKS.LEFT_EYE_OUTER],
            mirrored[POSE_LANDMARKS.RIGHT_EYE_OUTER],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_EYE_OUTER],
            mirrored[POSE_LANDMARKS.LEFT_EYE_OUTER],
          ];

          // Trocar orelhas
          [
            mirrored[POSE_LANDMARKS.LEFT_EAR],
            mirrored[POSE_LANDMARKS.RIGHT_EAR],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_EAR],
            mirrored[POSE_LANDMARKS.LEFT_EAR],
          ];

          // Trocar boca
          [
            mirrored[POSE_LANDMARKS.MOUTH_LEFT],
            mirrored[POSE_LANDMARKS.MOUTH_RIGHT],
          ] = [
            mirrored[POSE_LANDMARKS.MOUTH_RIGHT],
            mirrored[POSE_LANDMARKS.MOUTH_LEFT],
          ];

          // Trocar ombros
          [
            mirrored[POSE_LANDMARKS.LEFT_SHOULDER],
            mirrored[POSE_LANDMARKS.RIGHT_SHOULDER],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_SHOULDER],
            mirrored[POSE_LANDMARKS.LEFT_SHOULDER],
          ];

          // Trocar cotovelos
          [
            mirrored[POSE_LANDMARKS.LEFT_ELBOW],
            mirrored[POSE_LANDMARKS.RIGHT_ELBOW],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_ELBOW],
            mirrored[POSE_LANDMARKS.LEFT_ELBOW],
          ];

          // Trocar punhos
          [
            mirrored[POSE_LANDMARKS.LEFT_WRIST],
            mirrored[POSE_LANDMARKS.RIGHT_WRIST],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_WRIST],
            mirrored[POSE_LANDMARKS.LEFT_WRIST],
          ];

          // Trocar mãos
          [
            mirrored[POSE_LANDMARKS.LEFT_PINKY],
            mirrored[POSE_LANDMARKS.RIGHT_PINKY],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_PINKY],
            mirrored[POSE_LANDMARKS.LEFT_PINKY],
          ];
          [
            mirrored[POSE_LANDMARKS.LEFT_INDEX],
            mirrored[POSE_LANDMARKS.RIGHT_INDEX],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_INDEX],
            mirrored[POSE_LANDMARKS.LEFT_INDEX],
          ];
          [
            mirrored[POSE_LANDMARKS.LEFT_THUMB],
            mirrored[POSE_LANDMARKS.RIGHT_THUMB],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_THUMB],
            mirrored[POSE_LANDMARKS.LEFT_THUMB],
          ];

          // Trocar quadris
          [
            mirrored[POSE_LANDMARKS.LEFT_HIP],
            mirrored[POSE_LANDMARKS.RIGHT_HIP],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_HIP],
            mirrored[POSE_LANDMARKS.LEFT_HIP],
          ];

          // Trocar joelhos
          [
            mirrored[POSE_LANDMARKS.LEFT_KNEE],
            mirrored[POSE_LANDMARKS.RIGHT_KNEE],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_KNEE],
            mirrored[POSE_LANDMARKS.LEFT_KNEE],
          ];

          // Trocar tornozelos
          [
            mirrored[POSE_LANDMARKS.LEFT_ANKLE],
            mirrored[POSE_LANDMARKS.RIGHT_ANKLE],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_ANKLE],
            mirrored[POSE_LANDMARKS.LEFT_ANKLE],
          ];

          // Trocar calcanhares
          [
            mirrored[POSE_LANDMARKS.LEFT_HEEL],
            mirrored[POSE_LANDMARKS.RIGHT_HEEL],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_HEEL],
            mirrored[POSE_LANDMARKS.LEFT_HEEL],
          ];

          // Trocar dedos dos pés
          [
            mirrored[POSE_LANDMARKS.LEFT_FOOT_INDEX],
            mirrored[POSE_LANDMARKS.RIGHT_FOOT_INDEX],
          ] = [
            mirrored[POSE_LANDMARKS.RIGHT_FOOT_INDEX],
            mirrored[POSE_LANDMARKS.LEFT_FOOT_INDEX],
          ];

          landmarks = mirrored;
        }

        state.value.landmarks = landmarks;
        state.value.worldLandmarks = result.worldLandmarks?.[0] || null;
      } else {
        state.value.landmarks = null;
        state.value.worldLandmarks = null;
      }
    } catch (error) {
      console.error('Error detecting pose:', error);
      stopDetection();
      state.value.error = `Detection error: ${error}`;
      return;
    }

    animationFrameId = requestAnimationFrame(detectPose);
  };

  // Start detection loop
  const startDetectionLoop = () => {
    if (!videoElement.value || !poseLandmarker.value) {
      console.error('Video element or pose landmarker not ready');
      return;
    }

    if (state.value.isDetecting) {
      console.warn('Detection already running');
      return;
    }

    console.log('Starting pose detection loop...');
    state.value.isDetecting = true;
    state.value.error = null;

    // Delay para garantir que o landmarker está pronto (IMAGE mode não precisa de tanto delay)
    setTimeout(() => {
      if (state.value.isDetecting && poseLandmarker.value) {
        detectPose();
      }
    }, 100);
  };

  // Start detection (initializes everything)
  const startDetection = async () => {
    try {
      // Reset state
      state.value.isReady = false;
      state.value.error = null;

      // Initialize pose landmarker
      await initialize();

      if (!state.value.isReady || !poseLandmarker.value) {
        throw new Error('Failed to initialize pose landmarker');
      }

      // Start webcam
      await startWebcam();

      // Start detection loop
      startDetectionLoop();
    } catch (error) {
      state.value.error = `Failed to start detection: ${error}`;
      console.error(state.value.error);
    }
  };
  // Stop detection
  const stopDetection = () => {
    state.value.isDetecting = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Stop webcam stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    // Clear video element
    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }
  };

  // Calculate angle between three points
  const calculateAngle = (
    a: PoseLandmark,
    b: PoseLandmark,
    c: PoseLandmark,
  ): number => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
      angle = 360 - angle;
    }

    return angle;
  };

  // Get arm angles (shoulder-elbow-wrist)
  const getArmAngles = (): ArmAngles | null => {
    if (!state.value.landmarks) return null;

    const landmarks = state.value.landmarks;

    try {
      const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
      const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

      // Calculate shoulder angle (relative to horizontal)
      const leftShoulderAngle = Math.atan2(
        leftElbow.y - leftShoulder.y,
        leftElbow.x - leftShoulder.x,
      );
      const rightShoulderAngle = Math.atan2(
        rightElbow.y - rightShoulder.y,
        rightElbow.x - rightShoulder.x,
      );

      // Calculate elbow angle
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist,
      );

      // Calculate wrist position relative to elbow
      const leftWristAngle = Math.atan2(
        leftWrist.y - leftElbow.y,
        leftWrist.x - leftElbow.x,
      );
      const rightWristAngle = Math.atan2(
        rightWrist.y - rightElbow.y,
        rightWrist.x - rightElbow.x,
      );

      // Retorna os ângulos (mirrorPose já foi aplicado aos landmarks)
      return {
        left: {
          shoulder: leftShoulderAngle * (180 / Math.PI),
          elbow: leftElbowAngle,
          wrist: leftWristAngle * (180 / Math.PI),
        },
        right: {
          shoulder: rightShoulderAngle * (180 / Math.PI),
          elbow: rightElbowAngle,
          wrist: rightWristAngle * (180 / Math.PI),
        },
      };
    } catch (error) {
      console.error('Error calculating arm angles:', error);
      return null;
    }
  };

  // Get head tilt (based on ears and nose)
  const getHeadTilt = (): number => {
    if (!state.value.landmarks) return 0;

    const landmarks = state.value.landmarks;
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];

    if (!leftEar || !rightEar) return 0;

    // Calculate angle between ears
    const angle = Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x);
    return (angle * 180) / Math.PI;
  };

  // Get torso tilt (based on shoulders and hips)
  const getTorsoTilt = (): number => {
    if (!state.value.landmarks) return 0;

    const landmarks = state.value.landmarks;
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;

    // Calculate center points
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipCenterX = (leftHip.x + rightHip.x) / 2;

    // Calculate lean angle
    const angle = Math.atan2(
      shoulderCenterY - hipCenterY,
      shoulderCenterX - hipCenterX,
    );
    return (angle * 180) / Math.PI - 90; // Subtract 90 to make upright = 0
  };

  // Get shoulder width (for scaling)
  const getShoulderWidth = (): number => {
    if (!state.value.landmarks) return 0;

    const landmarks = state.value.landmarks;
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!leftShoulder || !rightShoulder) return 0;

    const dx = rightShoulder.x - leftShoulder.x;
    const dy = rightShoulder.y - leftShoulder.y;

    return Math.sqrt(dx * dx + dy * dy);
  };

  // Cleanup
  onUnmounted(() => {
    stopDetection();
    if (poseLandmarker.value) {
      poseLandmarker.value.close();
    }
  });

  return {
    state,
    initialize,
    startDetection,
    stopDetection,
    getArmAngles,
    getHeadTilt,
    getTorsoTilt,
    getShoulderWidth,
  };
}
