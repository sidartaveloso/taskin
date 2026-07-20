export type {
  PrioritizationSortMode,
  PrioritizationViewMode,
  PriorityGroupNode,
  PriorityNode,
  PriorityTaskNode,
  UsePrioritization,
  UsePrioritizationOptions,
} from './use-prioritization';
export {
  buildPriorityTree,
  diffAgainstBaseline,
  flattenPriorityTree,
  renumber,
  usePrioritization,
} from './use-prioritization';

// Re-export UiSense composables for backward compatibility
export type { ElementPosition } from '@opentask/ui-sense';
export { useElementTracking } from '@opentask/ui-sense';
export type { EyeOffset, EyeTrackingOptions, TrackingPosition } from '@opentask/ui-sense';
export { useEyeTracking } from '@opentask/ui-sense';
export type { FaceLandmarkerBlendShapes, FaceLandmarkerResult, FaceLandmarkerState, UseFaceLandmarkerOptions } from '@opentask/ui-sense';
export { useFaceLandmarker } from '@opentask/ui-sense';
export type { CannedGesture, GestureRecognizerState, Handedness, HandLandmark, RecognizedGesture, UseGestureRecognizerOptions } from '@opentask/ui-sense';
export { useGestureRecognizer } from '@opentask/ui-sense';
export type { GestureMapping, PrioritizationAction, WizardState } from '@opentask/ui-sense';
export { useGestureShortcuts } from '@opentask/ui-sense';
export type { MousePosition } from '@opentask/ui-sense';
export { useMouseTracking } from '@opentask/ui-sense';
export type { PoseLandmarkerResult, PoseLandmarkerState, UsePoseLandmarkerOptions } from '@opentask/ui-sense';
export { usePoseLandmarker } from '@opentask/ui-sense';
export type { NoiseWatcher } from '@opentask/ui-sense';
export { createNoiseWatcher } from '@opentask/ui-sense';
