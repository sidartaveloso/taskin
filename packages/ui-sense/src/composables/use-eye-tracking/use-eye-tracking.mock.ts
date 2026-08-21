import { vi } from 'vitest';
import { computed, type Ref } from 'vue';
import type { EyeOffset, EyeTrackingOptions, TrackingPosition } from './use-eye-tracking.types';

export interface UseEyeTrackingReturn {
  pupilOffset: Ref<EyeOffset>;
}

export function createEyeTrackingMock(): UseEyeTrackingReturn {
  return {
    pupilOffset: computed<EyeOffset>(() => ({ x: 0, y: 0 })),
  };
}

export const useEyeTracking = vi.fn(
  (_targetPosition: Ref<TrackingPosition>, _options: EyeTrackingOptions): UseEyeTrackingReturn =>
    createEyeTrackingMock(),
);
