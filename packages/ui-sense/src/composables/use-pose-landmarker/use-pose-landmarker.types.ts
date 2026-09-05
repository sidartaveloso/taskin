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

// `ArmAngles` mora em `arm-angles.ts`, junto do calculo: os angulos carregam a
// marca do espaco em que foram medidos, e o tipo antigo, de `number` cru, era o
// que permitia o desencontro da task-044.

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
