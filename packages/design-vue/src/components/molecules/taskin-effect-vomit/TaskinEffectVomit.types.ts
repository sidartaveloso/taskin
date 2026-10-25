import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectVomitProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: it follows that character's face.
   */
  variant?: TaskinVariant;
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
