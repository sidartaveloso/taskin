import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectHeartsProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
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
