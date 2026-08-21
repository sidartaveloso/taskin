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
