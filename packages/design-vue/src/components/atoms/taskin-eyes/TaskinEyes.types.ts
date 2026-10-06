export type EyeState = 'normal' | 'closed' | 'squint' | 'wide';
export type TrackingMode = 'none' | 'mouse' | 'element' | 'custom';

// Props principais
export interface TaskinEyesProps {
  state?: EyeState;
  animationsEnabled?: boolean;
  trackingBounds?: number;
  trackingMode?: TrackingMode;

  /** Where the eyes sit and how they look: the character's eye geometry. Default: the octopus'. */
  geometry?: EyeGeometry;

  // Propriedades específicas de cada modo
  lookDirection?: 'center' | 'left' | 'right' | 'up' | 'down'; // usado quando trackingMode='none'
  targetElement?: HTMLElement | string; // usado quando trackingMode='element'
  customPosition?: { x: number; y: number }; // usado quando trackingMode='custom'
}

/** Where the eyes are, and how they look in each state, in the 320x260 viewBox. */
export interface EyeGeometry {
  left: { x: number; y: number };
  right: { x: number; y: number };
  /** Horizontal radius of the white. */
  rx: number;
  /** Vertical radius of the white, per state. */
  ry: Record<EyeState, number>;
  pupilRadius: Record<EyeState, number>;
  /**
   * Whether the white is outlined. Without an outline a closed eye would vanish
   * into the body, so the closed state always draws the stroke: it is the lid.
   */
  outline: boolean;
  /**
   * Where each pupil rests inside its white, before looking anywhere. Tracking
   * and the look direction move the pupil from here.
   */
  pupilRest: { left: { x: number; y: number }; right: { x: number; y: number } };
  /** Colour of the pupils, the outline and the lid. */
  ink: string;
}

/**
 * The octopus' eyes. They are also the engine's reference frame: the effects
 * tied to the face were drawn around them, and move by however much a
 * character's eyes sit away from these (`eyeShift`, in the character module).
 */
export const TASKIN_EYE_GEOMETRY: EyeGeometry = {
  left: { x: 135, y: 90 },
  right: { x: 185, y: 90 },
  rx: 12,
  ry: { normal: 14, closed: 1, squint: 8, wide: 18 },
  pupilRadius: { normal: 5, closed: 0, squint: 2, wide: 3 },
  outline: true,
  pupilRest: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
  ink: '#2C3E50',
};
