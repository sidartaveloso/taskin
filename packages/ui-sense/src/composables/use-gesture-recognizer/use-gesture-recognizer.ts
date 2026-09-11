import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { onUnmounted, type Ref, ref } from 'vue';
import { requestMediaStream } from '../../utils/camera';
import type {
  CannedGesture,
  GestureRecognizerState,
  Handedness,
  RecognizedGesture,
  UseGestureRecognizerOptions,
} from './use-gesture-recognizer.types';

const CANNED_GESTURES: CannedGesture[] = [
  'None',
  'Closed_Fist',
  'Open_Palm',
  'Pointing_Up',
  'Thumb_Down',
  'Thumb_Up',
  'Victory',
  'ILoveYou',
];

export function useGestureRecognizer(
  videoElement: Ref<HTMLVideoElement | null>,
  options: UseGestureRecognizerOptions = {},
) {
  const {
    numHands = 2,
    minHandDetectionConfidence = 0.5,
    minHandPresenceConfidence = 0.5,
    minTrackingConfidence = 0.5,
    gestureScoreThreshold = 0.6,
  } = options;

  const gestureRecognizer = ref<GestureRecognizer | null>(null);
  const state = ref<GestureRecognizerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    gestures: [],
    landmarks: null,
  });

  const lastActionTime = ref(0);
  const lastGesture = ref<CannedGesture>('None');

  let animationFrameId: number | null = null;
  let stream: MediaStream | null = null;

  const startWebcam = async () => {
    try {
      stream = await requestMediaStream();

      if (videoElement.value) {
        videoElement.value.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoElement.value) {
            videoElement.value.onloadedmetadata = () => resolve();
          }
        });
        await videoElement.value.play();
      }
    } catch (error) {
      state.value.error = `Failed to access webcam: ${error}`;
      console.error('Webcam access error:', error);
    }
  };

  const initialize = async () => {
    try {
      state.value.error = null;

      if (gestureRecognizer.value) {
        gestureRecognizer.value.close();
        gestureRecognizer.value = null;
      }

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
      );

      gestureRecognizer.value = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numHands,
        minHandDetectionConfidence,
        minHandPresenceConfidence,
        minTrackingConfidence,
      });

      state.value.isReady = true;
    } catch (error) {
      state.value.error = `Failed to initialize gesture recognizer: ${error}`;
      console.error(state.value.error);
    }
  };

  const recognize = () => {
    if (!state.value.isDetecting) return;

    if (!state.value.isReady) {
      animationFrameId = requestAnimationFrame(recognize);
      return;
    }

    if (!gestureRecognizer.value) {
      stopDetection();
      state.value.error = 'Gesture recognizer instance lost';
      return;
    }

    if (!videoElement.value) {
      animationFrameId = requestAnimationFrame(recognize);
      return;
    }

    const video = videoElement.value;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameId = requestAnimationFrame(recognize);
      return;
    }

    try {
      const result = gestureRecognizer.value.recognize(video);

      const recognized: RecognizedGesture[] = [];

      // `entries()` mantem o indice, que a mao correspondente precisa
      for (const [i, candidates] of (result.gestures ?? []).entries()) {
        const [top] = candidates;
        if (top?.categoryName && CANNED_GESTURES.includes(top.categoryName as CannedGesture)) {
          recognized.push({
            gesture: top.categoryName as CannedGesture,
            score: top.score,
            handedness: (result.handedness?.[i]?.[0]?.categoryName as Handedness) || 'Right',
          });
        }
      }

      state.value.gestures = recognized;
      state.value.landmarks = result.landmarks || null;
    } catch (error) {
      console.error('Gesture recognition error:', error);
    }

    animationFrameId = requestAnimationFrame(recognize);
  };

  const startDetectionLoop = () => {
    if (!videoElement.value || !gestureRecognizer.value) {
      console.error('Video element or gesture recognizer not ready');
      return;
    }

    if (state.value.isDetecting) {
      console.warn('Detection already running');
      return;
    }

    state.value.isDetecting = true;
    state.value.error = null;

    setTimeout(() => {
      if (state.value.isDetecting && gestureRecognizer.value) {
        recognize();
      }
    }, 100);
  };

  const startDetection = async () => {
    try {
      state.value.isReady = false;
      state.value.error = null;

      await initialize();

      if (!state.value.isReady || !gestureRecognizer.value) {
        throw new Error('Failed to initialize gesture recognizer');
      }

      await startWebcam();
      startDetectionLoop();
    } catch (error) {
      state.value.error = `Failed to start detection: ${error}`;
      console.error(state.value.error);
    }
  };

  const stopDetection = () => {
    state.value.isDetecting = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      stream = null;
    }

    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }
  };

  const getStableGesture = (): RecognizedGesture | null => {
    if (state.value.gestures.length === 0) {
      lastGesture.value = 'None';
      return null;
    }

    const best = state.value.gestures.reduce((a, b) => (a.score > b.score ? a : b));

    if (best.score < gestureScoreThreshold) {
      lastGesture.value = 'None';
      return null;
    }

    return best;
  };

  const getDominantGesture = (): RecognizedGesture | null => {
    if (state.value.gestures.length === 0) return null;
    return state.value.gestures.reduce((a, b) => (a.score > b.score ? a : b));
  };

  const isGestureHeld = (gesture: CannedGesture, minHoldMs: number = 300): boolean => {
    const best = getDominantGesture();
    if (!best || best.gesture !== gesture) {
      lastGesture.value = 'None';
      return false;
    }

    const now = Date.now();

    if (lastGesture.value !== gesture) {
      lastGesture.value = gesture;
      lastActionTime.value = now;
      return false;
    }

    return now - lastActionTime.value >= minHoldMs;
  };

  onUnmounted(() => {
    stopDetection();
    if (gestureRecognizer.value) {
      gestureRecognizer.value.close();
    }
  });

  return {
    state,
    initialize,
    startDetection,
    stopDetection,
    getDominantGesture,
    getStableGesture,
    isGestureHeld,
  };
}
