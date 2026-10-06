import { TASKIN_ARM_GEOMETRY } from '../../../../atoms/taskin-arms/TaskinArms.types';
import { TASKIN_EYE_GEOMETRY } from '../../../../atoms/taskin-eyes/TaskinEyes.types';
import { TASKIN_MOUTH } from '../../../../atoms/taskin-mouth/TaskinMouth.types';
import { defineCharacter } from '../../character/define-character';
import { celebratePose, EFFORT, POINT_DOWN, POINT_UP, START, WAKE, WAVE } from '../../character/poses';
import SkeletonBody from './SkeletonBody';

/**
 * The skeleton: the engine's reference frame drawn as markings, with no
 * animal. It is where a new character starts (copy it, then replace the data
 * and the parts) and what the engine's own tests run on, so they never depend
 * on any one animal. Its anchors are the octopus', the frame the effects were
 * drawn in. It has every common action, with no body motion: the poses (arms,
 * eyes, mouth) are what it shows.
 */
export const SKELETON_CHARACTER = defineCharacter({
  id: 'skeleton',
  name: 'Skeleton',
  colors: { bodyColor: '#8a99a3', bodyHighlight: '#e4e9ed', tentacleColor: '#8a99a3' },
  eyes: TASKIN_EYE_GEOMETRY,
  mouth: TASKIN_MOUTH,
  arms: TASKIN_ARM_GEOMETRY,
  shadow: { rx: 70, ry: 12, fill: '#eef1f3' },
  parts: { body: SkeletonBody },
  motion: {
    byMood: {},
    listeningClass: 'skeleton-listening',
    css: '',
  },
  actions: {
    nod: { className: 'skeleton-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'skeleton-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'skeleton-celebrate', durationMs: 1200, pose: celebratePose(-70, -100) },
    'point-up': { className: 'skeleton-point-up', durationMs: 900, pose: POINT_UP },
    'point-down': { className: 'skeleton-point-down', durationMs: 900, pose: POINT_DOWN },
    wave: { className: 'skeleton-wave', durationMs: 1400, pose: WAVE },
    start: { className: 'skeleton-start', durationMs: 1100, pose: START },
    effort: { className: 'skeleton-effort', durationMs: 2000, pose: EFFORT },
    wake: { className: 'skeleton-wake', durationMs: 2000, pose: WAKE },
    'travel-left': { className: 'skeleton-travel-left', durationMs: 900, pose: { lookDirection: 'left' } },
    'travel-right': { className: 'skeleton-travel-right', durationMs: 900, pose: { lookDirection: 'right' } },
  },
  listening: { eyeState: 'wide' },
  bubbles: {
    base: { cx: 243, cy: 34 },
    leftLimit: 170,
    maxBottom: 72,
    tip: { x: 210, y: 86 },
    headRight: 229,
  },
  effortHands: { left: { x: 91, y: 72 }, right: { x: 229, y: 72 } },
});
