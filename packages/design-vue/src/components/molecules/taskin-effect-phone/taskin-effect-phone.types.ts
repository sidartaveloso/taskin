export interface TaskinEffectPhoneProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;
}

export interface TaskinEffectPhoneController {
  /**
   * Show phone
   */
  show(): void;

  /**
   * Hide phone
   */
  hide(): void;
}
