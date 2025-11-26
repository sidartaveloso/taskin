export type TentacleId =
  | 'tentacle-front-left'
  | 'tentacle-front-right'
  | 'tentacle-side-left'
  | 'tentacle-side-right'
  | 'tentacle-back-left'
  | 'tentacle-back-right';

/**
 * Defines the properties for TaskinTentacle component (Atom).
 * Represents a single tentacle with customizable shape and animations.
 * Supports both static paths and fluid animated paths.
 */

export type TentaclePathGenerator = (progress: number) => string;
export type TentacleAnimationKeyframes = Record<string, string>;

/**
 * Props for the TaskinTentacle component
 */
export interface TaskinTentacleProps {
  /**
   * Color of the tentacle
   * @default '#1f7acb'
   */
  color?: string;

  /**
   * Enable/disable animations
   * @default true
   */
  animationsEnabled?: boolean;

  /**
   * Enable wiggle animation
   * @default false
   */
  wiggle?: boolean;

  /**
   * Enable dance animation
   * @default false
   */
  dance?: boolean;

  /**
   * SVG path data for the tentacle shape (static mode)
   * If not provided, will use fluid animation
   */
  d?: string;

  /**
   * Stroke width of the tentacle
   * @default 14
   */
  strokeWidth?: number;

  /**
   * X position offset
   * @default 0
   */
  x?: number;

  /**
   * Y position offset
   * @default 0
   */
  y?: number;

  /**
   * Animation delay in seconds
   * @default 0
   */
  animationDelay?: number;

  /**
   * Animation speed multiplier (for fluid mode)
   * @default 1
   */
  speed?: number;

  /**
   * Custom path generator function
   * Receives progress (0-100) and returns SVG path string
   */
  pathGenerator?: TentaclePathGenerator;

  /**
   * Custom animation keyframes for fluid motion
   * Object with percentage keys and path values
   */
  animationKeyframes?: TentacleAnimationKeyframes;

  /**
   * Tentacle length (for fluid mode)
   * @default 60
   */
  length?: number;

  /**
   * Use fluid animation mode (animates path shape)
   * @default false
   */
  fluid?: boolean;
}

export interface TaskinTentacleController {
  /**
   * Wiggle a specific tentacle
   */
  wiggleTentacle(
    id: TentacleId,
    intensityDeg?: number,
    durationMs?: number,
  ): void;

  /**
   * Wiggle all tentacles with delay
   */
  wiggleAll(intensityDeg?: number, durationMs?: number): void;

  /**
   * Change tentacle color
   */
  changeColor(color: string): void;
}
