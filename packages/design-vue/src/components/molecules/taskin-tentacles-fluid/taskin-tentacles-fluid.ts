import { h, type PropType } from 'vue';
import type { TentacleAnimationKeyframes } from '../../atoms/taskin-tentacle/taskin-tentacle';
import TaskinTentacle from '../../atoms/taskin-tentacle/taskin-tentacle';

export interface TaskinTentaclesFluidProps {
  /**
   * Color of the tentacles
   * @default '#FF6B9D'
   */
  color?: string;
  /**
   * Enable/disable animations
   * @default true
   */
  animationsEnabled?: boolean;
  /**
   * Animation speed multiplier
   * @default 1
   */
  speed?: number;
  /**
   * Number of tentacles to render
   * @default 4
   */
  count?: number;
  /**
   * Spacing between tentacles
   * @default 20
   */
  spacing?: number;
  /**
   * Custom animation keyframes (applied to all tentacles)
   */
  animationKeyframes?: TentacleAnimationKeyframes;
}

/**
 * TaskinTentaclesFluid - Molecular component
 *
 * Composes multiple fluid tentacles with coordinated animations.
 * A simple compositor that creates a group of animated tentacles.
 *
 * @component
 * @example
 * <TaskinTentaclesFluid color="#FF6B9D" :count="4" :speed="1" />
 */
export const TaskinTentaclesFluid = {
  name: 'TaskinTentaclesFluid',
  props: {
    color: {
      type: String as PropType<string>,
      default: '#FF6B9D',
    },
    animationsEnabled: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    speed: {
      type: Number as PropType<number>,
      default: 1,
    },
    count: {
      type: Number as PropType<number>,
      default: 4,
    },
    spacing: {
      type: Number as PropType<number>,
      default: 20,
    },
    animationKeyframes: {
      type: Object as PropType<TentacleAnimationKeyframes>,
      default: undefined,
    },
  },
  setup(props: {
    color?: string;
    animationsEnabled?: boolean;
    speed: number;
    count: number;
    spacing: number;
    animationKeyframes?: Record<string, string>;
    wiggle?: boolean;
  }) {
    return () => {
      const tentacles = [];
      const totalWidth = (props.count - 1) * props.spacing;
      const startX = -totalWidth / 2;

      for (let i = 0; i < props.count; i++) {
        const x = startX + i * props.spacing;
        const speedVariation = 0.8 + i * 0.1; // Slight speed variation per tentacle

        tentacles.push(
          h(TaskinTentacle, {
            key: `tentacle-${i}`,
            color: props.color,
            animationsEnabled: props.animationsEnabled,
            speed: props.speed * speedVariation,
            fluid: true,
            x,
            y: 0,
            strokeWidth: 8,
            animationKeyframes: props.animationKeyframes,
          }),
        );
      }

      return h('g', tentacles);
    };
  },
};

export default TaskinTentaclesFluid;
