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
