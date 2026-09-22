declare const angleSpace: unique symbol;

/**
 * An angle in degrees, tagged with the space it is measured in.
 *
 * Both spaces are plain numbers at runtime, so nothing stops them from being
 * added or compared — but the tag stops one from being passed where the other
 * is expected, which is the whole defect this exists to prevent. See
 * task-044: the pose produced screen-space angles, the mascot consumed
 * side-relative ones, both typed `number`, and the left arm drew itself into
 * the body for months without anyone noticing.
 *
 * @public
 */
export type Degrees<TSpace extends 'screen' | 'sideRelative'> = number & {
  readonly [angleSpace]: TSpace;
};

/**
 * An angle measured from the horizontal in the image's own frame, y growing
 * down — what `Math.atan2` over two landmarks gives you.
 *
 * @public
 */
export type ScreenAngle = Degrees<'screen'>;

/**
 * An angle authored as if it belonged to the right side of a front-facing
 * figure, to be mirrored for the left one.
 *
 * This is the space a human types by hand: the same number describes both arms
 * of a symmetric pose, which is why the mascot's neutral is `35` on both sides
 * instead of `35` and `145`.
 *
 * @public
 */
export type SideRelativeAngle = Degrees<'sideRelative'>;

/** Which arm an angle belongs to. @public */
export type ArmSide = 'left' | 'right';

/**
 * Brings a raw degree value into screen space.
 *
 * The only supported way to produce one: a tag is meaningless if callers can
 * reach it with a cast.
 *
 * @public
 */
export const screenAngle = (degrees: number): ScreenAngle => normalize(degrees) as ScreenAngle;

/**
 * Brings a raw degree value into side-relative space.
 *
 * @public
 */
export const sideRelativeAngle = (degrees: number): SideRelativeAngle => normalize(degrees) as SideRelativeAngle;

/**
 * Folds a degree value into `(-180, 180]`, the range `Math.atan2` reports, so
 * two angles describing the same direction are the same number.
 */
function normalize(degrees: number): number {
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

/**
 * Mirrors an arm angle across the figure's vertical axis.
 *
 * The right side is the identity, because side-relative space is authored from
 * it; the left side is `180 - angle`, which flips the horizontal component and
 * leaves the vertical one alone.
 *
 * The function is its own inverse (`180 - (180 - d) === d`), so one function
 * converts in both directions — and the overloads are what make the compiler
 * refuse both a missing conversion and a doubled one.
 *
 * @param degrees - The angle to mirror
 * @param side - Which arm it belongs to
 * @public
 */
export function mirrorAngleForSide(degrees: ScreenAngle, side: ArmSide): SideRelativeAngle;
export function mirrorAngleForSide(degrees: SideRelativeAngle, side: ArmSide): ScreenAngle;
export function mirrorAngleForSide(degrees: number, side: ArmSide): number {
  return side === 'right' ? normalize(degrees) : normalize(180 - degrees);
}

/**
 * Eases an angle toward a target, taking the shorter way around.
 *
 * Shortest-arc and not straight-line interpolation: a normalized angle jumps
 * from 179 to -179 when the arm passes the vertical, and interpolating those as
 * numbers sweeps 358 degrees — a full turn on screen for two degrees of real
 * movement. It is also what keeps MediaPipe's frame-to-frame jitter from
 * reaching the drawing untouched.
 *
 * @param from - Where the joint is now
 * @param to - Where the pose says it should be
 * @param factor - How much of the gap to close, 0 to 1
 * @returns The eased angle, in the same space as the inputs
 * @public
 */
export function smoothAngle<TSpace extends 'screen' | 'sideRelative'>(
  from: Degrees<TSpace>,
  to: Degrees<TSpace>,
  factor: number,
): Degrees<TSpace> {
  const delta = normalize(to - from);

  return normalize(from + delta * factor) as Degrees<TSpace>;
}
