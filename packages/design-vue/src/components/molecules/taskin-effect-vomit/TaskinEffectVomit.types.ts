export interface TaskinEffectVomitProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;
}

export interface TaskinEffectVomitController {
  /**
   * Show vomit effect
   */
  show(): void;

  /**
   * Hide vomit effect
   */
  hide(): void;
}
