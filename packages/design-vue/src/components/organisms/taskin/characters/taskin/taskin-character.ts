import { armPosition, TASKIN_ARM_GEOMETRY } from '../../../../atoms/taskin-arms/TaskinArms.types';
import { TASKIN_EYE_GEOMETRY } from '../../../../atoms/taskin-eyes/TaskinEyes.types';
import { TASKIN_MOUTH } from '../../../../atoms/taskin-mouth/TaskinMouth.types';
import type { ActionPose } from '../../character/character.types';
import { defineCharacter } from '../../character/define-character';
import { celebratePose, EFFORT, POINT_DOWN, POINT_UP, START, WAKE, WAVE } from '../../character/poses';
import TaskinOctopusBody from './TaskinOctopusBody';
import TaskinTentacles from './TaskinTentacles';
import { TASKIN_MOTION_BY_MOOD, TASKIN_MOTION_CSS } from './taskin-motion';

/**
 * Hands on hips, face turned, brow down. Crossed arms did not fit: the arm is
 * 50 long and the shoulder sits 65 from the middle, so over the belly, in the
 * body colour, they vanished. Elbows out, they show.
 */
const BLOCKED: ActionPose = {
  leftArm: armPosition(10, 150),
  rightArm: armPosition(10, 150),
  lookDirection: 'left',
  mouthExpression: 'frown',
};

/** The octopus' fright, on `ink`: wide eyes and an O mouth. */
const INK: ActionPose = { eyeState: 'wide', mouthExpression: 'o-shape' };

/**
 * Taskin, the octopus: the default character. Round body, tentacles behind it,
 * blue. Juggles when there are too many tasks in progress, and squirts ink when
 * something fails.
 */
export const TASKIN_CHARACTER = defineCharacter({
  id: 'taskin',
  name: 'Taskin',
  colors: { bodyColor: '#1f7acb', bodyHighlight: '#2090e0', tentacleColor: '#1f7acb' },
  eyes: TASKIN_EYE_GEOMETRY,
  mouth: TASKIN_MOUTH,
  arms: TASKIN_ARM_GEOMETRY,
  shadow: { rx: 70, ry: 14, fill: '#d8e2f0' },
  parts: { body: TaskinOctopusBody, back: TaskinTentacles },
  motion: {
    byMood: TASKIN_MOTION_BY_MOOD,
    listeningClass: 'taskin-listening',
    jugglingClass: 'taskin-juggling',
    css: TASKIN_MOTION_CSS,
  },
  actions: {
    nod: { className: 'taskin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'taskin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'taskin-celebrate', durationMs: 1200, pose: celebratePose(-70, -100) },
    'point-up': { className: 'taskin-point-up', durationMs: 900, pose: POINT_UP },
    'point-down': { className: 'taskin-point-down', durationMs: 900, pose: POINT_DOWN },
    wave: { className: 'taskin-wave', durationMs: 1400, pose: WAVE },
    start: { className: 'taskin-start', durationMs: 1100, pose: START },
    blocked: { className: 'taskin-blocked', durationMs: 1600, pose: BLOCKED },
    effort: { className: 'taskin-effort', durationMs: 2000, pose: EFFORT },
    wake: { className: 'taskin-wake', durationMs: 2000, pose: WAKE },
    'travel-left': { className: 'taskin-travel-left', durationMs: 900, pose: { lookDirection: 'left' } },
    'travel-right': { className: 'taskin-travel-right', durationMs: 900, pose: { lookDirection: 'right' } },
    ink: { className: 'taskin-ink', durationMs: 1600, pose: INK },
  },
  // The octopus brings the right hand up by the head, as if to hear better; eyes wide.
  listening: { rightArm: armPosition(-50, -140), eyeState: 'wide' },
  bubbles: {
    base: { cx: 243, cy: 34 },
    leftLimit: 170,
    // The right eye goes from y 72 to 108 and up to x 199: the bubble ends above it.
    maxBottom: 72,
    tip: { x: 210, y: 86 },
    headRight: 229,
  },
  effortHands: { left: { x: 91, y: 72 }, right: { x: 229, y: 72 } },
});
