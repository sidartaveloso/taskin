import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectVomitProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
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
