import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';

export interface TaskinEffectSpeechBubbleProps {
  /**
   * What the mascot is saying. The bubble grows with the phrase, like the
   * thought bubble does.
   */
  text?: string;

  /**
   * Enable animations: a short pop when the bubble appears.
   */
  animationsEnabled?: boolean;

  /** Which character the effect sits on: it follows that character's anchors. Default: the octopus. */
  character?: TaskinCharacter;
}
