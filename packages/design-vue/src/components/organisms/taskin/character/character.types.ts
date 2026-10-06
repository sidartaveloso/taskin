import type { Component } from 'vue';
import type { ArmGeometry, ArmPosition } from '../../../atoms/taskin-arms/TaskinArms.types';
import type { EyeGeometry, EyeState } from '../../../atoms/taskin-eyes/TaskinEyes.types';
import type { MouthExpression } from '../../../atoms/taskin-mouth/TaskinMouth.types';
import type { TaskinAction } from '../Taskin.actions';
import type { TaskinMood } from '../Taskin.types';

/**
 * A character the mascot engine can play.
 *
 * The engine (`Taskin`) owns the behaviour: moods, blinking, gaze tracking,
 * speech, one-shot actions and the effects. It draws no animal. A character
 * says where its parts sit in the 320x260 frame and what to draw for the parts
 * that are drawings (the body, what goes behind it, what goes in front of the
 * mouth). Everything else is data the engine reads.
 *
 * The effects (tears, hearts, Zzz, sweat, vomit) were drawn around the Taskin
 * octopus' face, so its eyes are the engine's reference frame: an effect moves
 * by however much the character's eyes (or mouth) moved away from them.
 *
 * Build one with `defineCharacter`, which keeps the literals and checks the shape.
 */
export interface TaskinCharacter {
  /**
   * Stable, kebab-case. Names the motion group (`#<id>-motion`), prefixes the
   * character's CSS classes and goes on the SVG as `data-character`.
   */
  readonly id: string;
  /** Human name, for stories and pickers. */
  readonly name: string;
  /** Base colours, used by the moods that have none of their own. */
  readonly colors: MoodColors;
  readonly eyes: EyeGeometry;
  readonly mouth: CharacterMouth;
  readonly arms: ArmGeometry;
  /** The shadow on the ground, outside the motion group. */
  readonly shadow: CharacterShadow;
  readonly parts: CharacterParts;
  readonly motion: CharacterMotion;
  /** What each one-shot action does on this character. A missing one resolves `false` at once. */
  readonly actions: Partial<Record<TaskinAction, ActionConfig>>;
  /** The pose held while the microphone is on (`listening`). */
  readonly listening: ActionPose;
  readonly bubbles: CharacterBubbles;
  /** Where the raised hands are during `effort`: the bar goes between them. */
  readonly effortHands: { readonly left: CharacterPoint; readonly right: CharacterPoint };
}

export interface CharacterPoint {
  readonly x: number;
  readonly y: number;
}

export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export interface MoodColors {
  readonly bodyColor: string;
  readonly bodyHighlight: string;
  readonly tentacleColor: string;
}

export interface CharacterMouth {
  /** How far the mouth sits from the reference drawing (the octopus mouth). */
  readonly offset: CharacterPoint;
  /** Colour of the lips, the open mouth and the tongue outline. */
  readonly ink: string;
}

export interface CharacterShadow {
  readonly rx: number;
  readonly ry: number;
  readonly fill: string;
}

/**
 * The drawings. Each one receives `CharacterPartProps`. `body` is required;
 * `back` goes behind it (the octopus' tentacles), `front` after the mouth
 * (the frog's tongue).
 */
export interface CharacterParts {
  readonly body: Component;
  readonly back?: Component;
  readonly front?: Component;
}

/** What the engine tells each drawn part, on every render. */
export interface CharacterPartProps {
  readonly character: TaskinCharacter;
  /** The colours of the current mood (or the character's base colours). */
  readonly colors: MoodColors;
  readonly mood: TaskinMood;
  readonly animationsEnabled: boolean;
  /** The idle fidget is on: the octopus wiggles a tentacle, the frog taps its toes. */
  readonly fidgeting: boolean;
  /** The one-shot action running now, if any. */
  readonly action: TaskinAction | null;
  readonly speaking: boolean;
}

/**
 * How the whole character moves. The engine puts `#<id>-motion` around every
 * part and adds, in this order of precedence, the running action's class, the
 * `listening` class or the mood's class. `css` is injected as a `<style>` in
 * the SVG and applies to the whole document, so its classes and keyframes must
 * be prefixed with the character id.
 */
export interface CharacterMotion {
  readonly byMood: Partial<Record<TaskinMood, string>>;
  readonly listeningClass: string;
  /** Added while `speaking`, on top of the rest (the frog's throat pulses). */
  readonly speakingClass?: string;
  /**
   * Present only on characters that juggle: added while `juggling > 0`, and the
   * engine draws the balls. Characters without it ignore `juggling`.
   */
  readonly jugglingClass?: string;
  readonly css: string;
}

/** What an action imposes while it runs, over the mood. An explicit prop still wins. */
export interface ActionPose {
  readonly leftArm?: ArmPosition;
  readonly rightArm?: ArmPosition;
  readonly eyeState?: EyeState;
  readonly lookDirection?: LookDirection;
  readonly mouthExpression?: MouthExpression;
}

export interface ActionConfig {
  /** Goes on `#<id>-motion` while the action runs, instead of the mood's. */
  readonly className: string;
  /** The end, by timer: a hidden tab freezes the animation and `animationend` would never come. */
  readonly durationMs: number;
  readonly pose?: ActionPose;
  /** Pose changes in the middle of the action: each step applies from `atMs` on. */
  readonly steps?: readonly { readonly atMs: number; readonly pose: ActionPose }[];
}

/**
 * Where the thought and speech bubbles go, in the 320x260 frame. Both stay off
 * the character's right eye: a bubble over it does not read.
 */
export interface CharacterBubbles {
  /** Where the bubble sits while the phrase fits the smallest bubble. */
  readonly base: { readonly cx: number; readonly cy: number };
  /** The bubble never reaches left of this: the head lives there. */
  readonly leftLimit: number;
  /** The bubble's bottom stays above this (the top of the eye), when the font can shrink to fit. */
  readonly maxBottom?: number;
  /** Where the speech tail and the thought trail point: right of the right eye, inside the head. */
  readonly tip: CharacterPoint;
  /** The right edge of the head, at mid-height: the HTML bubble of `TaskinSays` leans on it. */
  readonly headRight: number;
}
