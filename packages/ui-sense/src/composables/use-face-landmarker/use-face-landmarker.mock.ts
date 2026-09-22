import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type { FaceLandmarkerState, UseFaceLandmarkerOptions } from './use-face-landmarker.types';

export interface UseFaceLandmarkerReturn {
  state: Ref<FaceLandmarkerState>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  getEyeLookDirection: () => { x: number; y: number };
  getEyeOpenness: () => { left: number; right: number };
  isEyesWide: () => boolean;
  getMouthOpenness: () => number;
  getSmileIntensity: () => number;
  getFrownIntensity: () => number;
}

export function createFaceLandmarkerMock(): UseFaceLandmarkerReturn {
  const state = ref<FaceLandmarkerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    blendShapes: null,
    landmarks: null,
  });

  return {
    state,
    startDetection: vi.fn(async () => undefined),
    stopDetection: vi.fn(),
    getEyeLookDirection: vi.fn(() => ({ x: 0, y: 0 })),
    getEyeOpenness: vi.fn(() => ({ left: 1, right: 1 })),
    isEyesWide: vi.fn(() => false),
    getMouthOpenness: vi.fn(() => 0),
    getSmileIntensity: vi.fn(() => 0),
    getFrownIntensity: vi.fn(() => 0),
  };
}

export const useFaceLandmarker = vi.fn(
  (_videoElement: Ref<HTMLVideoElement | null>, _options?: UseFaceLandmarkerOptions): UseFaceLandmarkerReturn =>
    createFaceLandmarkerMock(),
);
