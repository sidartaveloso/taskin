import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectSweatProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: it follows that character's face.
   */
  variant?: TaskinVariant;
}
