/** Quantas bolinhas o Taskin tem no ar: uma por task a mais em andamento. */
export type JuggleBalls = 0 | 1 | 2 | 3;

export interface TaskinEffectJuggleProps {
  /**
   * How many balls are in the air. With 0 nothing is drawn.
   */
  balls?: JuggleBalls;

  /**
   * Enable animations. Without them the balls hold still at the top of the arc.
   */
  animationsEnabled?: boolean;
}
