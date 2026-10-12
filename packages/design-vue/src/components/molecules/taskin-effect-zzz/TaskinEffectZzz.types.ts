import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinEffectZzzProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /**
   * Which character the effect sits on: it follows that character's face.
   */
  variant?: TaskinVariant;
}

export interface TaskinEffectZzzController {
  /**
   * Show Zzz
   */
  show(): void;

  /**
   * Hide Zzz
   */
  hide(): void;
}
