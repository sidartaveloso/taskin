import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export interface TaskinBodyProps {
  bodyColor?: string;
  bodyHighlight?: string;
  animationsEnabled?: boolean;
  float?: boolean;
  bounce?: boolean;
  sway?: boolean;
  /** Which character to draw: the round octopus body or the frog, legs included. */
  variant?: TaskinVariant;
  /** The Sapin taps its toes (its idle wiggle, in place of the tentacles'). */
  tapToes?: boolean;
}
