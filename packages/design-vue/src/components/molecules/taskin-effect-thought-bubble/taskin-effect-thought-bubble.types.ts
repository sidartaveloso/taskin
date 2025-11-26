export interface TaskinEffectThoughtBubbleProps {
  /**
   * Text to display in bubble
   */
  text?: string;

  /**
   * Enable animations
   */
  animationsEnabled?: boolean;
}

export interface TaskinEffectThoughtBubbleController {
  /**
   * Show thought bubble
   */
  show(text?: string): void;

  /**
   * Hide thought bubble
   */
  hide(): void;
}
