import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type { ArmAngles, PoseLandmarkerState, UsePoseLandmarkerOptions } from './use-pose-landmarker.types';

export interface UsePoseLandmarkerReturn {
  state: Ref<PoseLandmarkerState>;
  initialize: () => Promise<void>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  getArmAngles: () => ArmAngles | null;
  getHeadTilt: () => number;
  getTorsoTilt: () => number;
  getShoulderWidth: () => number;
}

export function createPoseLandmarkerMock(): UsePoseLandmarkerReturn {
  const state = ref<PoseLandmarkerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    landmarks: null,
    worldLandmarks: null,
  });

  return {
    state,
    initialize: vi.fn(async () => undefined),
    startDetection: vi.fn(async () => undefined),
    stopDetection: vi.fn(),
    getArmAngles: vi.fn((): ArmAngles | null => null),
    getHeadTilt: vi.fn(() => 0),
    getTorsoTilt: vi.fn(() => 0),
    getShoulderWidth: vi.fn(() => 0),
  };
}

export const usePoseLandmarker = vi.fn(
  (_videoElement: Ref<HTMLVideoElement | null>, _options?: UsePoseLandmarkerOptions): UsePoseLandmarkerReturn =>
    createPoseLandmarkerMock(),
);
