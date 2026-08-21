export interface TaskinEffectTearsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;
}

export interface TaskinEffectTearsController {
  /**
   * Show tears
   */
  show(): void;

  /**
   * Hide tears
   */
  hide(): void;
}
