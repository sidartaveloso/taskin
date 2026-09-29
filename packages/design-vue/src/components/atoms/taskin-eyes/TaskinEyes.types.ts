import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export type EyeState = 'normal' | 'closed' | 'squint' | 'wide';
export type TrackingMode = 'none' | 'mouse' | 'element' | 'custom';

// Props principais
export interface TaskinEyesProps {
  state?: EyeState;
  animationsEnabled?: boolean;
  trackingBounds?: number;
  trackingMode?: TrackingMode;

  /** Which character the eyes belong to: they sit in a different place on each. */
  variant?: TaskinVariant;

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
}

/**
 * A geometria dos olhos de cada variante. E a fonte das posicoes: o corpo do
 * Sapin desenha os calombos em volta destes centros, e as lagrimas caem deles —
 * quem precisa de onde o olho esta importa daqui, sem copiar o numero.
 *
 * O Sapin tem os olhos saltados no topo da cabeca, redondos e sem contorno,
 * como na referencia (`TASKS/assets/sapin/sapin-mascote.png`).
 */
export const EYE_GEOMETRY: Record<TaskinVariant, EyeGeometry> = {
  taskin: {
    left: { x: 135, y: 90 },
    right: { x: 185, y: 90 },
    rx: 12,
    ry: { normal: 14, closed: 1, squint: 8, wide: 18 },
    pupilRadius: { normal: 5, closed: 0, squint: 2, wide: 3 },
    outline: true,
  },
  sapin: {
    left: { x: 121, y: 71 },
    right: { x: 199, y: 71 },
    rx: 15.5,
    ry: { normal: 15.5, closed: 1.5, squint: 9, wide: 18 },
    pupilRadius: { normal: 6, closed: 0, squint: 3, wide: 4 },
    outline: false,
  },
};

/**
 * Quanto um olho anda do Taskin para a variante; `center` e o meio dos dois.
 *
 * Os efeitos presos aos olhos (lagrimas, Zzz, coracoes) foram desenhados em
 * volta dos olhos do Taskin. Andando junto com o olho, ficam no mesmo lugar do
 * rosto em qualquer variante, sem uma tabela de posicoes por efeito.
 */
export const eyeShift = (variant: TaskinVariant, side: 'left' | 'right' | 'center'): { x: number; y: number } => {
  const delta = (lado: 'left' | 'right') => ({
    x: EYE_GEOMETRY[variant][lado].x - EYE_GEOMETRY.taskin[lado].x,
    y: EYE_GEOMETRY[variant][lado].y - EYE_GEOMETRY.taskin[lado].y,
  });
  if (side !== 'center') return delta(side);

  const left = delta('left');
  const right = delta('right');
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
};
