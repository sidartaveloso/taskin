import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { onUnmounted, ref, type Ref } from 'vue';

// Tipos do MediaPipe Face Landmarker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceLandmarkerInstance = any; // MediaPipe não exporta tipos TypeScript completos
export interface FaceLandmarkerBlendShapes {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  jawOpen: number;
  mouthClose: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  mouthPucker: number;
  [key: string]: number;
}

export interface FaceLandmarkerResult {
  faceLandmarks: Array<{ x: number; y: number; z: number }[]>;
  faceBlendshapes?: Array<{
    categories: Array<{ categoryName: string; score: number }>;
  }>;
}

export interface FaceLandmarkerState {
  isReady: boolean;
  isDetecting: boolean;
  error: string | null;
  blendShapes: FaceLandmarkerBlendShapes | null;
  landmarks: Array<{ x: number; y: number; z: number }> | null;
}

export interface UseFaceLandmarkerOptions {
  enableBlendshapes?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  mirrorEyeTracking?: boolean;
  onDetection?: (result: FaceLandmarkerResult) => void;
}

/**
 * Composable para usar MediaPipe Face Landmarker
 * Detecta expressões faciais em tempo real via webcam
 */
export function useFaceLandmarker(
  videoElement: Ref<HTMLVideoElement | null>,
  options: UseFaceLandmarkerOptions = {},
) {
  const state = ref<FaceLandmarkerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    blendShapes: null,
    landmarks: null,
  });

  let faceLandmarker: FaceLandmarkerInstance = null;
  let animationFrameId: number | null = null;
  let stream: MediaStream | null = null;

  /**
   * Inicializa o MediaPipe Face Landmarker
   */
  const initializeFaceLandmarker = async () => {
    try {
      console.log('Inicializando MediaPipe Face Landmarker...');

      // Inicializa o FilesetResolver para carregar os arquivos WASM
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );

      console.log('Criando FaceLandmarker...');
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputFaceBlendshapes: options.enableBlendshapes ?? true,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
        minFaceDetectionConfidence: options.minDetectionConfidence ?? 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      });

      console.log('FaceLandmarker inicializado com sucesso!');
      state.value.isReady = true;
      state.value.error = null;
    } catch (error) {
      state.value.error = `Erro ao inicializar Face Landmarker: ${error}`;
      console.error('Face Landmarker initialization error:', error);
    }
  };

  /**
   * Inicia a webcam
   */
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
        await videoElement.value.play();
      }
    } catch (error) {
      state.value.error = `Erro ao acessar webcam: ${error}`;
      console.error('Webcam access error:', error);
    }
  };

  /**
   * Processa cada frame do vídeo
   */
  const detectFace = () => {
    if (!faceLandmarker || !videoElement.value || !state.value.isReady) {
      return;
    }

    const video = videoElement.value;
    if (video.readyState < 2) {
      animationFrameId = requestAnimationFrame(detectFace);
      return;
    }

    try {
      const timestamp = performance.now();
      const results = faceLandmarker.detectForVideo(video, timestamp);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        state.value.landmarks = results.faceLandmarks[0];

        // Processa blendshapes se disponíveis
        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const blendShapes: FaceLandmarkerBlendShapes = {
            eyeBlinkLeft: 0,
            eyeBlinkRight: 0,
            eyeLookDownLeft: 0,
            eyeLookDownRight: 0,
            eyeLookInLeft: 0,
            eyeLookInRight: 0,
            eyeLookOutLeft: 0,
            eyeLookOutRight: 0,
            eyeLookUpLeft: 0,
            eyeLookUpRight: 0,
            eyeSquintLeft: 0,
            eyeSquintRight: 0,
            eyeWideLeft: 0,
            eyeWideRight: 0,
            jawOpen: 0,
            mouthClose: 0,
            mouthSmileLeft: 0,
            mouthSmileRight: 0,
            mouthFrownLeft: 0,
            mouthFrownRight: 0,
            mouthPucker: 0,
          };

          results.faceBlendshapes[0].categories.forEach(
            (category: { categoryName: string; score: number }) => {
              blendShapes[category.categoryName] = category.score;
            },
          );

          state.value.blendShapes = blendShapes;
        }

        // Callback opcional
        if (options.onDetection) {
          options.onDetection(results);
        }
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }

    animationFrameId = requestAnimationFrame(detectFace);
  };

  /**
   * Inicia a detecção facial
   */
  const startDetection = async () => {
    if (state.value.isDetecting) return;

    state.value.isDetecting = true;
    state.value.error = null;

    if (!faceLandmarker) {
      await initializeFaceLandmarker();
    }

    await startWebcam();

    // Aguarda o vídeo estar pronto
    if (videoElement.value) {
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (videoElement.value && videoElement.value.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    detectFace();
  };

  /**
   * Para a detecção facial
   */
  const stopDetection = () => {
    state.value.isDetecting = false;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }
  };

  /**
   * Calcula a direção do olhar baseada nos blendshapes
   */
  const getEyeLookDirection = (): { x: number; y: number } => {
    if (!state.value.blendShapes) {
      return { x: 0, y: 0 };
    }

    const bs = state.value.blendShapes;

    // Horizontal:
    // - eyeLookInLeft + eyeLookOutRight = olhando para a esquerda (negativo)
    // - eyeLookOutLeft + eyeLookInRight = olhando para a direita (positivo)
    let horizontal =
      (bs.eyeLookOutLeft + bs.eyeLookInRight) / 2 -
      (bs.eyeLookInLeft + bs.eyeLookOutRight) / 2;

    // Vertical: cima (negativo) vs baixo (positivo)
    let vertical =
      (bs.eyeLookDownLeft + bs.eyeLookDownRight) / 2 -
      (bs.eyeLookUpLeft + bs.eyeLookUpRight) / 2;

    // Se mirrorEyeTracking está habilitado, inverte o horizontal
    // para que o Taskin olhe na mesma direção que você (efeito espelho)
    if (options.mirrorEyeTracking) {
      horizontal = -horizontal;
    }

    // Amplifica mais o movimento para cima (valores negativos)
    // para compensar a limitação dos blendshapes
    if (vertical < 0) {
      vertical = vertical * 1.5; // 50% mais movimento quando olha para cima
    }

    return {
      x: horizontal * 100, // Escala para pixels
      y: vertical * 100,
    };
  }; /**
   * Calcula o quanto os olhos estão abertos (0 = fechado, 1 = aberto)
   */
  const getEyeOpenness = (): { left: number; right: number } => {
    if (!state.value.blendShapes) {
      return { left: 1, right: 1 };
    }

    const bs = state.value.blendShapes;

    return {
      left: Math.max(0, 1 - bs.eyeBlinkLeft - bs.eyeSquintLeft * 0.5),
      right: Math.max(0, 1 - bs.eyeBlinkRight - bs.eyeSquintRight * 0.5),
    };
  };

  /**
   * Verifica se os olhos estão arregalados
   */
  const isEyesWide = (): boolean => {
    if (!state.value.blendShapes) return false;
    const bs = state.value.blendShapes;
    return (bs.eyeWideLeft + bs.eyeWideRight) / 2 > 0.5;
  };

  /**
   * Calcula abertura da boca (0 = fechada, 1 = totalmente aberta)
   */
  const getMouthOpenness = (): number => {
    if (!state.value.blendShapes) return 0;
    return state.value.blendShapes.jawOpen;
  };

  /**
   * Calcula o quanto está sorrindo (0 = neutro, 1 = sorriso completo)
   */
  const getSmileIntensity = (): number => {
    if (!state.value.blendShapes) return 0;
    const bs = state.value.blendShapes;
    return (bs.mouthSmileLeft + bs.mouthSmileRight) / 2;
  };

  /**
   * Calcula o quanto está franzindo a testa (0 = neutro, 1 = franzido)
   */
  const getFrownIntensity = (): number => {
    if (!state.value.blendShapes) return 0;
    const bs = state.value.blendShapes;
    return (bs.mouthFrownLeft + bs.mouthFrownRight) / 2;
  };

  // Cleanup ao desmontar
  onUnmounted(() => {
    stopDetection();
  });

  return {
    state,
    startDetection,
    stopDetection,
    getEyeLookDirection,
    getEyeOpenness,
    isEyesWide,
    getMouthOpenness,
    getSmileIntensity,
    getFrownIntensity,
  };
}
