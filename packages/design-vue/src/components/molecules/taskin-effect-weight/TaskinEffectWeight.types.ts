import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectWeightProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: the bar sits between that character's raised hands.
   */
  variant?: TaskinVariant;
}
