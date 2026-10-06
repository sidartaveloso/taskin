import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectTearsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
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
