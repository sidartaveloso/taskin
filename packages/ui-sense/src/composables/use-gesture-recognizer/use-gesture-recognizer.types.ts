export type CannedGesture =
  | 'None'
  | 'Closed_Fist'
  | 'Open_Palm'
  | 'Pointing_Up'
  | 'Thumb_Down'
  | 'Thumb_Up'
  | 'Victory'
  | 'ILoveYou';

export type Handedness = 'Left' | 'Right';

export interface RecognizedGesture {
  gesture: CannedGesture;
  score: number;
  handedness: Handedness;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureRecognizerState {
  isReady: boolean;
  isDetecting: boolean;
  error: string | null;
  gestures: RecognizedGesture[];
  landmarks: HandLandmark[][] | null;
}

export interface UseGestureRecognizerOptions {
  numHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
  gestureScoreThreshold?: number;
  hysteresisMs?: number;
}
