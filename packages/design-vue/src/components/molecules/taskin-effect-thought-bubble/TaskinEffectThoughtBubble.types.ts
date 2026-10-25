import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectThoughtBubbleProps {
  /**
   * Text to display in bubble
   */
  text?: string;

  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the bubble comes from: it sits clear of that character's eyes.
   */
  variant?: TaskinVariant;
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
