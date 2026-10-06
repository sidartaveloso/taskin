import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectThoughtBubbleProps {
  /**
   * Text to display in bubble
   */
  text?: string;

  /**
   * Enable animations
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
}

export interface TaskinEffectThoughtBubbleController {
  /**
   * Show thought bubble
   */
  show(text?: string): void;

  /**
   * Hide thought bubble
   */
  hide(): void;
}
