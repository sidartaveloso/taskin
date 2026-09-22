import type { Ref } from 'vue';

export interface TrackingPosition {
  x: number;
  y: number;
}

export interface EyeOffset {
  x: number;
  y: number;
}

export interface EyeTrackingOptions {
  eyeCenterX: number;
  eyeCenterY: number;
  maxOffset?: number;
  containerElement?: Ref<SVGElement | null>;
}
