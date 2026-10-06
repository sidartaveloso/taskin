import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectZzzProps {
  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
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
