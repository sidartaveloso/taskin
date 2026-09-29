import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectTearsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: it follows that character's face.
   */
  variant?: TaskinVariant;
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
