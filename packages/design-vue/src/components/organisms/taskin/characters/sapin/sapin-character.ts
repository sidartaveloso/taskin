import { armPosition } from '../../../../atoms/taskin-arms/TaskinArms.types';
import type { ActionConfig, ActionPose } from '../../character/character.types';
import { defineCharacter } from '../../character/define-character';
import { celebratePose, EFFORT, POINT_DOWN, POINT_UP, START, WAKE, WAVE } from '../../character/poses';
import SapinBody from './SapinBody.vue';
import SapinTongue from './SapinTongue';
import { SAPIN_MOTION_BY_MOOD, SAPIN_MOTION_CSS } from './sapin-motion';

/** The Sapin sits down and loses heart: squinting, mouth down. */
const BLOCKED: ActionPose = { eyeState: 'squint', mouthExpression: 'frown' };

/**
 * The strike, on `catch-fly`: the eyes follow the fly to the right and, at 60%,
 * when it stops in front of the mouth, come back to the centre and the mouth
 * opens for the tongue. On the gulp, a smile.
 */
const CATCH_FLY: Pick<ActionConfig, 'pose' | 'steps'> = {
  pose: { lookDirection: 'right' },
  steps: [
    { atMs: 960, pose: { lookDirection: 'center', mouthExpression: 'open' } },
    { atMs: 1280, pose: { mouthExpression: 'smile' } },
  ],
};

/**
 * Sapin, the little frog of the SAP brand (reference:
 * `TASKS/assets/sapin/sapin-mascote.png`): eyes on bumps on top of the head,
 * light belly, thin arms, crouched legs with ball-tipped toes. No tentacles:
 * the idle fidget taps the toes. Catches flies with the tongue.
 */
export const SAPIN_CHARACTER = defineCharacter({
  id: 'sapin',
  name: 'Sapin',
  colors: { bodyColor: '#4DB848', bodyHighlight: '#CDEEC8', tentacleColor: '#4DB848' },
  // Eyes on top of the head, no outline, a little taller than wide, pupils pulled towards the nose.
  eyes: {
    left: { x: 121, y: 71 },
    right: { x: 199, y: 71 },
    rx: 14.8,
    ry: { normal: 15.5, closed: 1.5, squint: 9, wide: 18 },
    pupilRadius: { normal: 6, closed: 0, squint: 3, wide: 4 },
    outline: false,
    pupilRest: { left: { x: 3, y: 0 }, right: { x: -3, y: 0 } },
    ink: '#213037',
  },
  // Higher, between the eyes and the belly; dark green ink.
  mouth: { offset: { x: 0, y: -21 }, ink: '#134635' },
  // Shoulders on the edge of the wider body; thicker arms, hanging in a wider arc.
  arms: {
    shoulder: { left: { x: 90, y: 113 }, right: { x: 230, y: 113 } },
    upperArmLength: 29.7,
    forearmLength: 33.4,
    strokeWidth: 11,
    restPose: armPosition(32, 72),
  },
  // Lighter and greyer than the octopus', as in the reference.
  shadow: { rx: 82, ry: 13, fill: '#E4E9ED' },
  parts: { body: SapinBody, front: SapinTongue },
  motion: {
    byMood: SAPIN_MOTION_BY_MOOD,
    listeningClass: 'sapin-listening',
    speakingClass: 'sapin-speaking',
    css: SAPIN_MOTION_CSS,
  },
  actions: {
    nod: { className: 'sapin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'sapin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'sapin-celebrate', durationMs: 1200, pose: celebratePose(-60, -100) },
    'point-up': { className: 'sapin-point-up', durationMs: 900, pose: POINT_UP },
    'point-down': { className: 'sapin-point-down', durationMs: 900, pose: POINT_DOWN },
    wave: { className: 'sapin-wave', durationMs: 1400, pose: WAVE },
    start: { className: 'sapin-start', durationMs: 1100, pose: START },
    blocked: { className: 'sapin-blocked', durationMs: 1600, pose: BLOCKED },
    effort: { className: 'sapin-effort', durationMs: 2000, pose: EFFORT },
    wake: { className: 'sapin-wake', durationMs: 2000, pose: WAKE },
    'catch-fly': { className: 'sapin-catch-fly', durationMs: 1600, ...CATCH_FLY },
    'travel-left': { className: 'sapin-travel-left', durationMs: 900, pose: { lookDirection: 'left' } },
    'travel-right': { className: 'sapin-travel-right', durationMs: 900, pose: { lookDirection: 'right' } },
  },
  listening: { eyeState: 'wide' },
  bubbles: {
    // Wholly right of the eye bump (up to x 222), so narrower than the octopus'.
    base: { cx: 268, cy: 34 },
    leftLimit: 224,
    tip: { x: 226, y: 90 },
    headRight: 233,
  },
  effortHands: { left: { x: 86, y: 52 }, right: { x: 234, y: 52 } },
});
