import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type { ElementPosition } from './use-element-tracking.types';

export interface UseElementTrackingReturn {
  position: Ref<ElementPosition>;
  isTracking: Ref<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
}

export function createElementTrackingMock(): UseElementTrackingReturn {
  return {
    position: ref<ElementPosition>({ x: 0, y: 0 }),
    isTracking: ref(false),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  };
}

export const useElementTracking = vi.fn(
  (_targetSelector: () => string | HTMLElement | undefined): UseElementTrackingReturn => createElementTrackingMock(),
);
