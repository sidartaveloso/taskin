import { armPosition } from '../../../atoms/taskin-arms/TaskinArms.types';
import type { ActionPose } from './character.types';

/**
 * Poses any character can reuse in its action table. The angles mean the same
 * on every character: the arm geometry (shoulders, lengths) turns them into
 * the drawing.
 */

/** Both arms up, smiling: the celebration. */
export const celebratePose = (shoulder: number, forearm: number): ActionPose => ({
  leftArm: armPosition(shoulder, forearm),
  rightArm: armPosition(shoulder, forearm),
  mouthExpression: 'smile',
});

/** The right arm points and the eyes follow: the move-up and move-down gestures. */
export const pointPose = (lookDirection: 'up' | 'down', shoulder: number, forearm: number): ActionPose => ({
  rightArm: armPosition(shoulder, forearm),
  lookDirection,
});

/** Up, the hand above the shoulder, almost vertical. */
export const POINT_UP = pointPose('up', -80, -88);

/** Down, the hand below the belly, close to the body. */
export const POINT_DOWN = pointPose('down', 85, 92);

/** The wave, on arrival and goodbye: the right arm raised, the hand by the head, smiling. */
export const WAVE: ActionPose = { rightArm: armPosition(-40, -95), mouthExpression: 'smile' };

/** The start: both arms bent, elbows out, hands at shoulder height, eyes open. */
export const START: ActionPose = {
  leftArm: armPosition(30, -70),
  rightArm: armPosition(30, -70),
  eyeState: 'wide',
};

/** The effort: both arms up holding the bar, eyes squeezed. Hands land on `effortHands`. */
export const EFFORT: ActionPose = {
  leftArm: armPosition(-70, -100),
  rightArm: armPosition(-70, -100),
  eyeState: 'squint',
};

/** Waking up: the yawn (O mouth, half-open eyes) and the stretch, arms in a V. */
export const WAKE: ActionPose = {
  leftArm: armPosition(-55, -70),
  rightArm: armPosition(-55, -70),
  eyeState: 'squint',
  mouthExpression: 'o-shape',
};
