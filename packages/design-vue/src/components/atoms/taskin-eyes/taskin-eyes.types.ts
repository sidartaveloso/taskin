export type EyeState = 'normal' | 'closed' | 'squint' | 'wide';
export type TrackingMode = 'none' | 'mouse' | 'element' | 'custom';

// Props principais
export interface TaskinEyesProps {
  state?: EyeState;
  animationsEnabled?: boolean;
  trackingBounds?: number;
  trackingMode?: TrackingMode;

  // Propriedades específicas de cada modo
  lookDirection?: 'center' | 'left' | 'right' | 'up' | 'down'; // usado quando trackingMode='none'
  targetElement?: HTMLElement | string; // usado quando trackingMode='element'
  customPosition?: { x: number; y: number }; // usado quando trackingMode='custom'
}
