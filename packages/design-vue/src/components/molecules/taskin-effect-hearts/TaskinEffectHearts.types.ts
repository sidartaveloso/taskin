export interface TaskinEffectHeartsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;
}

export interface TaskinEffectHeartsController {
  /**
   * Show hearts
   */
  show(): void;

  /**
   * Hide hearts
   */
  hide(): void;
}
