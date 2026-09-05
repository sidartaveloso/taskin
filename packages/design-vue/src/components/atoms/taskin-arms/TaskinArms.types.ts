import type { ArmAngle, ArmSide, SideRelativeAngle } from '@opentask/ui-sense';
import { mirrorAngleForSide, sideRelativeAngle, smoothAngle } from '@opentask/ui-sense';

export type { ArmSide, SideRelativeAngle } from '@opentask/ui-sense';

/**
 * One of the mascot's arms, as two directions.
 *
 * Two directions and not "a direction plus a bend": the pose measures the upper
 * arm and the forearm independently, and the drawing needs exactly those two.
 * The previous shape carried a `wristAngle` that nothing read and an
 * `elbowAngle` whose scale disagreed with its producer — the interior angle a
 * pose reports is 180 for a straight arm, while the drawing treated it as a
 * deviation from straight, so a straight arm folded backwards. See task-044.
 *
 * Both angles are side-relative: the same pair describes both arms of a
 * symmetric pose, which is why the neutral below is one value per joint instead
 * of two. `mirrorAngleForSide` converts to and from screen space.
 */
export interface ArmPosition {
  /** Direction of the upper arm, shoulder to elbow */
  shoulderAngle: SideRelativeAngle;
  /** Direction of the forearm, elbow to wrist */
  forearmAngle: SideRelativeAngle;
}

export interface ArmsPositions {
  left: ArmPosition;
  right: ArmPosition;
}

/**
 * Builds an {@link ArmPosition} from two plain degree values.
 *
 * Exists so hand-authored poses stay readable: a tagged number needs a
 * constructor, and `armPosition(35, 65)` beats spelling both out at every call
 * site.
 *
 * @param shoulder - Direction of the upper arm
 * @param forearm - Direction of the forearm
 */
export const armPosition = (shoulder: number, forearm: number): ArmPosition => ({
  shoulderAngle: sideRelativeAngle(shoulder),
  forearmAngle: sideRelativeAngle(forearm),
});

/**
 * Brings one measured arm into the space the mascot draws in.
 *
 * The single place the two spaces meet. Every consumer of pose data goes
 * through it, which is what keeps the conversion from being skipped (the bug of
 * task-044) or applied twice — the tags make both mistakes fail to compile.
 *
 * `angles.elbow` is deliberately unused: it is the interior angle of the joint,
 * useful to read but not a direction, and the drawing is defined by the two
 * directions it already has.
 *
 * @param angles - One arm, as measured from the pose
 * @param side - Which arm it is, on screen
 */
export const armPositionFromPose = (angles: ArmAngle, side: ArmSide): ArmPosition => ({
  shoulderAngle: mirrorAngleForSide(angles.shoulder, side),
  forearmAngle: mirrorAngleForSide(angles.wrist, side),
});

/**
 * How much of the gap to the newly measured pose to close each frame.
 *
 * Chosen for the feel of the mascot, not for accuracy: the landmarks jitter a
 * couple of degrees between frames even when the person is still, and following
 * them exactly reads as a tremor.
 */
export const ARM_SMOOTHING_FACTOR = 0.35;

/**
 * Eases one arm from where it is toward where the pose puts it.
 *
 * @param current - The position being displayed
 * @param target - The position the pose asks for
 * @param factor - How much of the gap to close
 */
export const smoothArmPosition = (
  current: ArmPosition,
  target: ArmPosition,
  factor: number = ARM_SMOOTHING_FACTOR,
): ArmPosition => ({
  shoulderAngle: smoothAngle(current.shoulderAngle, target.shoulderAngle, factor),
  forearmAngle: smoothAngle(current.forearmAngle, target.forearmAngle, factor),
});

/** Arms angled down and out, with a slight bend. */
export const NEUTRAL_ARM_POSITION: ArmPosition = {
  shoulderAngle: sideRelativeAngle(35),
  forearmAngle: sideRelativeAngle(65),
};

export const NEUTRAL_ARMS_POSITIONS: ArmsPositions = {
  left: NEUTRAL_ARM_POSITION,
  right: NEUTRAL_ARM_POSITION,
};

export interface TaskinArmsProps {
  color?: string;
  animationsEnabled?: boolean;
  leftArmPosition?: ArmPosition;
  rightArmPosition?: ArmPosition;
}
