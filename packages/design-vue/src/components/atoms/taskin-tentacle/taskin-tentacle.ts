import { h, type PropType } from 'vue';

export type TentaclePathGenerator = (progress: number) => string;
export type TentacleAnimationKeyframes = Record<string, string>;

// Default wave path generator - keeps base fixed at (0,0)
const defaultPathGenerator: TentaclePathGenerator = (progress) => {
  const phase = (progress / 100) * Math.PI * 2;
  const amplitude = 5;

  return `M 0,0 Q ${amplitude * Math.sin(phase)},10 0,20 Q ${-amplitude * Math.sin(phase)},30 0,40 Q ${amplitude * Math.sin(phase)},50 0,60`;
};

// Default animation keyframes - base point (0,0) stays fixed
const defaultKeyframes: TentacleAnimationKeyframes = {
  '0%, 100%': 'M 0,0 Q 5,10 0,20 Q -5,30 0,40 Q 5,50 0,60',
  '25%': 'M 0,0 Q -5,10 0,20 Q 5,30 0,40 Q -5,50 0,60',
  '50%': 'M 0,0 Q 3,10 0,20 Q -3,30 0,40 Q 3,50 0,60',
  '75%': 'M 0,0 Q -3,10 0,20 Q 3,30 0,40 Q -3,50 0,60',
};

export default {
  name: 'TaskinTentacle',
  props: {
    color: {
      type: String as PropType<string>,
      default: '#1f7acb',
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    wiggle: {
      type: Boolean,
      default: false,
    },
    dance: {
      type: Boolean,
      default: false,
    },
    curl: {
      type: Boolean,
      default: false,
    },
    uncurl: {
      type: Boolean,
      default: false,
    },
    /**
     * SVG path data for the tentacle shape (static tentacle)
     * If not provided, will use fluid animation with keyframes
     */
    d: {
      type: String as PropType<string>,
      default: undefined,
    },
    /**
     * Stroke width of the tentacle
     * @default 14
     */
    strokeWidth: {
      type: Number as PropType<number>,
      default: 14,
    },
    /**
     * X position offset
     * @default 0
     */
    x: {
      type: Number as PropType<number>,
      default: 0,
    },
    /**
     * Y position offset
     * @default 0
     */
    y: {
      type: Number as PropType<number>,
      default: 0,
    },
    /**
     * Animation delay in seconds
     * @default 0
     */
    animationDelay: {
      type: Number as PropType<number>,
      default: 0,
    },
    /**
     * Animation speed multiplier (for fluid tentacles)
     * @default 1
     */
    speed: {
      type: Number as PropType<number>,
      default: 1,
    },
    /**
     * Custom path generator function
     * Receives progress (0-100) and returns SVG path string
     */
    pathGenerator: {
      type: Function as PropType<TentaclePathGenerator>,
      default: undefined,
    },
    /**
     * Custom animation keyframes for fluid motion
     * Object with percentage keys and path values
     */
    animationKeyframes: {
      type: Object as PropType<TentacleAnimationKeyframes>,
      default: undefined,
    },
    /**
     * Tentacle length (for fluid tentacles)
     * @default 60
     */
    length: {
      type: Number as PropType<number>,
      default: 60,
    },
    /**
     * Use fluid animation mode (animates path shape)
     * @default false
     */
    fluid: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: {
    color?: string;
    x: number;
    y: number;
    side: 'left' | 'right';
    index: number;
    animationsEnabled?: boolean;
    d?: string;
    strokeWidth: number;
    animationDelay: number;
    speed: number;
    pathGenerator?: (progress: number) => string;
    animationKeyframes?: Record<string, string>;
    length: number;
    fluid?: boolean;
    wiggle?: boolean;
    dance?: boolean;
    curl?: boolean;
    uncurl?: boolean;
  }) {
    return () => {
      const animationDuration =
        props.animationsEnabled && props.speed > 0
          ? `${2 / props.speed}s`
          : '0s';

      const isFluid = props.fluid || !props.d;
      const keyframes = props.animationKeyframes || defaultKeyframes;
      const pathGen = props.pathGenerator || defaultPathGenerator;

      const initialPath = isFluid
        ? typeof keyframes['0%, 100%'] === 'string'
          ? keyframes['0%, 100%']
          : keyframes['0%'] || pathGen(0)
        : props.d;

      const keyframesString = isFluid
        ? Object.entries(keyframes)
            .map(([key, value]) => `${key} { d: path("${value}"); }`)
            .join('\n            ')
        : '';

      const styles = h(
        'style',
        `
        @keyframes tentacle-wiggle-${props.x}-${props.y} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes tentacle-wave-${props.x}-${props.y} {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-2deg); }
          75% { transform: translateY(2px) rotate(2deg); }
        }
        @keyframes tentacle-curl-${props.x}-${props.y} {
          0% {
            d: path("M 0,0 L 0,60");
          }
          20% {
            d: path("M 0,0 Q 10,10 10,20 Q 10,30 5,40 Q 0,50 0,60");
          }
          40% {
            d: path("M 0,0 Q 15,5 20,10 Q 22,15 20,20 Q 15,25 10,25 Q 5,23 5,18 Q 7,13 12,13");
          }
          60% {
            d: path("M 0,0 Q 18,3 23,6 Q 26,10 25,15 Q 22,20 17,22 Q 11,22 7,19 Q 4,15 5,10 Q 7,6 11,5 Q 15,5 17,8 Q 18,11 16,13");
          }
          80% {
            d: path("M 0,0 Q 20,2 25,4 Q 28,7 28,11 Q 27,16 23,19 Q 18,21 13,20 Q 8,18 6,14 Q 4,10 6,7 Q 9,4 13,4 Q 17,4 19,7 Q 20,10 18,12 Q 16,13 13,12");
          }
          100% {
            d: path("M 0,0 Q 22,1 27,3 Q 30,6 30,10 Q 29,15 25,18 Q 20,20 15,19 Q 10,17 7,13 Q 5,9 6,6 Q 8,3 12,2 Q 16,2 19,4 Q 21,7 20,10 Q 19,12 16,13 Q 13,13 11,11 Q 10,9 11,7");
          }
        }
        @keyframes tentacle-uncurl-${props.x}-${props.y} {
          0% {
            d: path("M 0,0 Q 22,1 27,3 Q 30,6 30,10 Q 29,15 25,18 Q 20,20 15,19 Q 10,17 7,13 Q 5,9 6,6 Q 8,3 12,2 Q 16,2 19,4 Q 21,7 20,10 Q 19,12 16,13 Q 13,13 11,11 Q 10,9 11,7");
          }
          20% {
            d: path("M 0,0 Q 20,2 25,4 Q 28,7 28,11 Q 27,16 23,19 Q 18,21 13,20 Q 8,18 6,14 Q 4,10 6,7 Q 9,4 13,4 Q 17,4 19,7 Q 20,10 18,12 Q 16,13 13,12");
          }
          40% {
            d: path("M 0,0 Q 18,3 23,6 Q 26,10 25,15 Q 22,20 17,22 Q 11,22 7,19 Q 4,15 5,10 Q 7,6 11,5 Q 15,5 17,8 Q 18,11 16,13");
          }
          60% {
            d: path("M 0,0 Q 15,5 20,10 Q 22,15 20,20 Q 15,25 10,25 Q 5,23 5,18 Q 7,13 12,13");
          }
          80% {
            d: path("M 0,0 Q 10,10 10,20 Q 10,30 5,40 Q 0,50 0,60");
          }
          100% {
            d: path("M 0,0 L 0,60");
          }
        }
        ${
          isFluid && props.animationsEnabled && props.speed > 0
            ? `
        @keyframes tentacle-fluid-${props.x}-${props.y} {
          ${keyframesString}
        }
        @keyframes tentacle-tip-${props.x}-${props.y} {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-3px, 0) rotate(-10deg);
          }
          50% {
            transform: translate(0, 0) rotate(0deg);
          }
          75% {
            transform: translate(3px, 0) rotate(10deg);
          }
        }
        `
            : ''
        }
        .tentacle-wiggle {
          animation: tentacle-wiggle-${props.x}-${props.y} 0.8s ease-in-out;
          transform-origin: 0 0;
        }
        .tentacle-dance path {
          animation: tentacle-wave-${props.x}-${props.y} 1s ease-in-out infinite;
          transform-origin: 0 0;
        }
        .tentacle-curl path {
          animation: tentacle-curl-${props.x}-${props.y} 3s ease-in-out forwards;
        }
        .tentacle-uncurl path {
          animation: tentacle-uncurl-${props.x}-${props.y} 3s ease-in-out forwards;
        }
      `,
      );

      const elements = [styles];

      // Render path
      elements.push(
        h('path', {
          d: initialPath,
          fill: 'none',
          stroke: props.color,
          'stroke-width': props.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          style: [
            props.animationDelay > 0
              ? `animation-delay: ${props.animationDelay}s;`
              : '',
            isFluid && props.animationsEnabled && props.speed > 0
              ? `animation: tentacle-fluid-${props.x}-${props.y} ${animationDuration} ease-in-out infinite;`
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        }),
      );

      // Fluid tentacle tip
      if (isFluid) {
        elements.push(
          h(
            'g',
            {
              transform: `translate(0, ${props.length})`,
              style:
                props.animationsEnabled && props.speed > 0
                  ? {
                      animation: `tentacle-tip-${props.x}-${props.y} ${animationDuration} ease-in-out infinite`,
                      'transform-origin': '0 0',
                    }
                  : undefined,
            },
            [
              h('circle', {
                cx: 0,
                cy: 0,
                r: props.strokeWidth * 0.625,
                fill: props.color,
              }),
            ],
          ),
        );

        // Inner highlights for depth
        elements.push(
          h('path', {
            d: `M 0,5 Q ${props.strokeWidth * 0.375},12 0,20 Q ${-props.strokeWidth * 0.375},28 0,35 Q ${props.strokeWidth * 0.375},42 0,${Math.min(50, props.length - 10)}`,
            fill: 'none',
            stroke: 'rgba(255, 255, 255, 0.3)',
            'stroke-width': props.strokeWidth * 0.25,
            'stroke-linecap': 'round',
            style:
              props.animationsEnabled && props.speed > 0
                ? `animation: tentacle-fluid-${props.x}-${props.y} ${animationDuration} ease-in-out infinite;`
                : undefined,
          }),
        );
      }

      return h(
        'g',
        {
          transform: `translate(${props.x}, ${props.y})`,
          class: [
            props.wiggle && props.animationsEnabled ? 'tentacle-wiggle' : '',
            props.dance && props.animationsEnabled ? 'tentacle-dance' : '',
            props.curl && props.animationsEnabled ? 'tentacle-curl' : '',
            props.uncurl && props.animationsEnabled ? 'tentacle-uncurl' : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
        elements,
      );
    };
  },
};
