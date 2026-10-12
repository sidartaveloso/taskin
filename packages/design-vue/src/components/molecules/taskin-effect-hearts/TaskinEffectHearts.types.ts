import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectHeartsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: it follows that character's face.
   */
  variant?: TaskinVariant;
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
