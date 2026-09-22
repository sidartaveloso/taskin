import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type {
  CannedGesture,
  GestureRecognizerState,
  RecognizedGesture,
  UseGestureRecognizerOptions,
} from './use-gesture-recognizer.types';

export interface UseGestureRecognizerReturn {
  state: Ref<GestureRecognizerState>;
  initialize: () => Promise<void>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  getDominantGesture: () => RecognizedGesture | null;
  getStableGesture: () => RecognizedGesture | null;
  isGestureHeld: (gesture: CannedGesture, minHoldMs?: number) => boolean;
}

export function createGestureRecognizerMock(): UseGestureRecognizerReturn {
  const state = ref<GestureRecognizerState>({
    isReady: false,
    isDetecting: false,
    error: null,
    gestures: [],
    landmarks: null,
  });

  return {
    state,
    initialize: vi.fn(async () => undefined),
    startDetection: vi.fn(async () => undefined),
    stopDetection: vi.fn(),
    getDominantGesture: vi.fn((): RecognizedGesture | null => null),
    getStableGesture: vi.fn((): RecognizedGesture | null => null),
    isGestureHeld: vi.fn(() => false),
  };
}

export const useGestureRecognizer = vi.fn(
  (_videoElement: Ref<HTMLVideoElement | null>, _options?: UseGestureRecognizerOptions): UseGestureRecognizerReturn =>
    createGestureRecognizerMock(),
);
