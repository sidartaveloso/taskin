import type { Ref } from 'vue';

export type TaskinArmSide = 'left' | 'right';

export type TaskinMood =
  | 'neutral'
  | 'smirk'
  | 'happy'
  | 'annoyed'
  | 'sarcastic'
  | 'crying';

export type TaskinTentacleId =
  | 'tentacle-front-left'
  | 'tentacle-front-right'
  | 'tentacle-side-left'
  | 'tentacle-side-right'
  | 'tentacle-back-left'
  | 'tentacle-back-right';

export interface TaskinProps {
  /**
   * Base size in pixels. Applied as width/height on the SVG.
   */
  size?: number;

  /**
   * Initial visual mood of Taskin.
   */
  mood?: TaskinMood;

  /**
   * If true, small idle animations will occur.
   */
  idleAnimation?: boolean;

  /**
   * Master switch for animations.
   */
  animationsEnabled?: boolean;
}

export interface TaskinController {
  raiseArm(
    side: TaskinArmSide,
    angleDeg?: number,
    durationMs?: number,
  ): TaskinController;
  lowerArms(durationMs?: number): TaskinController;

  smile(durationMs?: number): TaskinController;
  neutralMouth(): TaskinController;

  blink(durationMs?: number): TaskinController;
  look(
    direction: 'left' | 'right' | 'center',
    amount?: number,
  ): TaskinController;

  setMood(mood: TaskinMood): TaskinController;

  sarcasticShrug(): TaskinController;

  speak(message: string): TaskinController;

  /**
   * Wiggle a specific tentacle by id.
   */
  wiggleTentacle(
    id: TaskinTentacleId,
    intensityDeg?: number,
    durationMs?: number,
  ): TaskinController;

  /**
   * Wiggle all tentacles with a small delay between them.
   */
  wiggleAllTentacles(
    intensityDeg?: number,
    durationMs?: number,
  ): TaskinController;

  /**
   * Add animated tears (for crying mood).
   */
  addTears(): TaskinController;

  /**
   * Remove tears.
   */
  removeTears(): TaskinController;
}

export interface TaskinExpose {
  controller: TaskinController;
}

export interface TaskinReadyPayload {
  controller: TaskinController;
  rootSvg: SVGElement;
}

export interface TaskinEmits {
  (e: 'ready', payload: TaskinReadyPayload): void;
}

export type TaskinInstance = Ref<TaskinExpose | null>;
