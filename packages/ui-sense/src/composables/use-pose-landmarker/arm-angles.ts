import type { ArmSide, ScreenAngle } from '../../utils/arm-angle';
import { screenAngle } from '../../utils/arm-angle';
import type { PoseLandmark } from './use-pose-landmarker.types';

/**
 * Indices of the six points an arm is made of, in MediaPipe's Pose model.
 *
 * `left`/`right` here are the side **of the screen**, because that is the side
 * the mascot draws on — and the screen side is the opposite of MediaPipe's
 * label. The model names joints after the subject's own body, and a person
 * facing the camera has their left shoulder on the right of the image: index
 * 11 is `LEFT_SHOULDER` and lands at a large `x`.
 *
 * `mirrorPose` does not change that. It flips `x` and then swaps the pairs, and
 * the two operations cancel where the screen is concerned: index 11 sits on the
 * right of the image in both modes. What the swap changes is whose body the
 * point belongs to, not where it is — which is why this mapping is
 * unconditional instead of depending on the flag.
 *
 * Getting this backwards drew both elbows *into* the body: each arm was
 * measured from the shoulder across the screen and then painted on the opposite
 * shoulder, so a person holding their arms out produced a mascot hugging
 * itself.
 */
const ARM_LANDMARKS = {
  left: { shoulder: 12, elbow: 14, wrist: 16 },
  right: { shoulder: 11, elbow: 13, wrist: 15 },
} as const satisfies Record<ArmSide, { shoulder: number; elbow: number; wrist: number }>;

/**
 * One arm, measured.
 *
 * @public
 */
export interface ArmAngle {
  /**
   * Direction of the upper arm, from the horizontal, in screen space.
   *
   * Screen space and not side-relative: this is the raw geometry, and the two
   * sides of a symmetric pose therefore read as mirror values (59deg and
   * 121deg), not as the same number. Convert with `mirrorAngleForSide` before
   * handing it to anything that draws.
   */
  shoulder: ScreenAngle;
  /**
   * Interior angle at the elbow, 0 to 180: 180 is a straight arm, small values
   * are a folded one. Not a direction, so it carries no space tag.
   */
  elbow: number;
  /** Direction of the forearm, from the horizontal, in screen space. */
  wrist: ScreenAngle;
}

/**
 * Both arms, measured.
 *
 * @public
 */
export type ArmAngles = Record<ArmSide, ArmAngle>;

/**
 * Interior angle at `vertex`, in degrees, folded into 0..180.
 */
function interiorAngle(from: PoseLandmark, vertex: PoseLandmark, to: PoseLandmark): number {
  const radians = Math.atan2(to.y - vertex.y, to.x - vertex.x) - Math.atan2(from.y - vertex.y, from.x - vertex.x);
  const degrees = Math.abs((radians * 180) / Math.PI);

  return degrees > 180 ? 360 - degrees : degrees;
}

function directionFrom(origin: PoseLandmark, target: PoseLandmark): ScreenAngle {
  return screenAngle((Math.atan2(target.y - origin.y, target.x - origin.x) * 180) / Math.PI);
}

/**
 * Measures both arms from a pose.
 *
 * Pure on purpose — the composable only owns the landmark stream, and this is
 * the part with the geometry worth testing.
 *
 * @param landmarks - A full pose, as MediaPipe reports it (already mirrored, if mirroring is on)
 * @returns Both arms, or `null` when any of the six points is absent
 * @public
 */
export function armAnglesFromLandmarks(landmarks: readonly PoseLandmark[]): ArmAngles | null {
  const measured = {} as Record<ArmSide, ArmAngle>;

  for (const side of ['left', 'right'] as const) {
    const indices = ARM_LANDMARKS[side];
    const shoulder = landmarks[indices.shoulder];
    const elbow = landmarks[indices.elbow];
    const wrist = landmarks[indices.wrist];

    if (!shoulder || !elbow || !wrist) {
      return null;
    }

    measured[side] = {
      shoulder: directionFrom(shoulder, elbow),
      elbow: interiorAngle(shoulder, elbow, wrist),
      wrist: directionFrom(elbow, wrist),
    };
  }

  return measured;
}
