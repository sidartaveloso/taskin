import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

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

  /**
   * Which character is speaking: the tail points at that character's mouth.
   */
  variant?: TaskinVariant;
}
