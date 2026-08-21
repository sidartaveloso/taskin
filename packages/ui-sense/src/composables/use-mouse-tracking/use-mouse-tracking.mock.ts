import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type { MousePosition } from './use-mouse-tracking.types';

export interface UseMouseTrackingReturn {
  position: Ref<MousePosition>;
  isTracking: Ref<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
}

export function createMouseTrackingMock(): UseMouseTrackingReturn {
  return {
    position: ref<MousePosition>({ x: 0, y: 0 }),
    isTracking: ref(false),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  };
}

export const useMouseTracking = vi.fn((): UseMouseTrackingReturn => createMouseTrackingMock());
