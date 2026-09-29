import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export type MouthExpression =
  | 'neutral'
  | 'smile'
  | 'frown'
  | 'open'
  | 'wide-open'
  | 'o-shape'
  | 'smirk'
  | 'surprised'
  /** Ofegante, de lingua para fora: o calor. */
  | 'panting';

export interface TaskinMouthProps {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
  /** Which character the mouth belongs to: it sits higher on the Sapin. */
  variant?: TaskinVariant;
}

/**
 * Quanto a boca de cada variante anda a partir do desenho do Taskin. As
 * expressoes sao as mesmas; no Sapin a boca fica mais alta, entre os olhos e a
 * barriga, como na referencia. O vomito sai da boca e le daqui a mesma ancora.
 */
export const MOUTH_OFFSET: Record<TaskinVariant, { x: number; y: number }> = {
  taskin: { x: 0, y: 0 },
  sapin: { x: 0, y: -21 },
};

/** O `transform` que leva um desenho preso a boca do Taskin para a boca da variante. */
export const mouthTransform = (variant: TaskinVariant): string | undefined => {
  const { x, y } = MOUTH_OFFSET[variant];
  return x === 0 && y === 0 ? undefined : `translate(${x} ${y})`;
};
