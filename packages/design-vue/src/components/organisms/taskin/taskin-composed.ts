import { computed, h, onMounted, onUnmounted, ref, type PropType } from 'vue';
import TaskinArms from '../../atoms/taskin-arms/taskin-arms.vue';
import TaskinBody from '../../atoms/taskin-body/taskin-body.vue';
import type { EyeState } from '../../atoms/taskin-eyes/taskin-eyes.types';
import TaskinEyes from '../../atoms/taskin-eyes/taskin-eyes.vue';
import type { MouthExpression } from '../../atoms/taskin-mouth/taskin-mouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/taskin-mouth.vue';
import TaskinArmWithPhone from '../../molecules/taskin-arm-with-phone/taskin-arm-with-phone.vue';
import TaskinEffectFartCloud from '../../molecules/taskin-effect-fart-cloud/taskin-effect-fart-cloud';
import TaskinEffectHearts from '../../molecules/taskin-effect-hearts/taskin-effect-hearts';
import TaskinEffectTears from '../../molecules/taskin-effect-tears/taskin-effect-tears';
import TaskinEffectThoughtBubble from '../../molecules/taskin-effect-thought-bubble/taskin-effect-thought-bubble';
import TaskinEffectVomit from '../../molecules/taskin-effect-vomit/taskin-effect-vomit';
import TaskinEffectZzz from '../../molecules/taskin-effect-zzz/taskin-effect-zzz';
import TaskinTentacleWithItem from '../../molecules/taskin-tentacle-with-item/taskin-tentacle-with-item.vue';
import type { TaskinMood } from './taskin.types';

type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down';

interface MoodConfig {
  bodyColor: string;
  bodyHighlight: string;
  tentacleColor: string;
  eyeState: EyeState;
  lookDirection: LookDirection;
  mouthExpression: MouthExpression;
  showTears: boolean;
  showHearts: boolean;
  showZzz: boolean;
  showThoughtBubble: boolean;
  thoughtBubbleText?: string;
  showVomit: boolean;
  showPhone: boolean;
  showFartCloud: boolean;
}

const MOOD_CONFIGS: Record<TaskinMood, MoodConfig> = {
  neutral: {
    bodyColor: '#1f7acb',
    bodyHighlight: '#2090e0',
    tentacleColor: '#1f7acb',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  smirk: {
    bodyColor: '#1f7acb',
    bodyHighlight: '#2090e0',
    tentacleColor: '#1f7acb',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smirk',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  happy: {
    bodyColor: '#FFD700',
    bodyHighlight: '#FFF44F',
    tentacleColor: '#FFD700',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smile',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  annoyed: {
    bodyColor: '#1f7acb',
    bodyHighlight: '#2090e0',
    tentacleColor: '#1f7acb',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  sarcastic: {
    bodyColor: '#1f7acb',
    bodyHighlight: '#2090e0',
    tentacleColor: '#1f7acb',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smile',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  crying: {
    bodyColor: '#4A90E2',
    bodyHighlight: '#6BB6FF',
    tentacleColor: '#4A90E2',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'frown',
    showTears: true,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  cold: {
    bodyColor: '#A0C4FF',
    bodyHighlight: '#C4D7FF',
    tentacleColor: '#A0C4FF',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  hot: {
    bodyColor: '#FF6B6B',
    bodyHighlight: '#FFA07A',
    tentacleColor: '#FF6B6B',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'wide-open',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  dancing: {
    bodyColor: '#9B59B6',
    bodyHighlight: '#BB8FCE',
    tentacleColor: '#9B59B6',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smile',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  furious: {
    bodyColor: '#DC143C',
    bodyHighlight: '#FF6347',
    tentacleColor: '#DC143C',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'frown',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  sleeping: {
    bodyColor: '#6C5CE7',
    bodyHighlight: '#A29BFE',
    tentacleColor: '#6C5CE7',
    eyeState: 'closed',
    lookDirection: 'center',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: true,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  'in-love': {
    bodyColor: '#FF69B4',
    bodyHighlight: '#FFB6C1',
    tentacleColor: '#FF69B4',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smile',
    showTears: false,
    showHearts: true,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  tired: {
    bodyColor: '#95A5A6',
    bodyHighlight: '#BDC3C7',
    tentacleColor: '#95A5A6',
    eyeState: 'squint',
    lookDirection: 'center',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  thoughtful: {
    bodyColor: '#5F4B8B',
    bodyHighlight: '#8B7BA8',
    tentacleColor: '#5F4B8B',
    eyeState: 'normal',
    lookDirection: 'up',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: true,
    thoughtBubbleText: '?',
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
  },
  vomiting: {
    bodyColor: '#7CB342',
    bodyHighlight: '#9CCC65',
    tentacleColor: '#7CB342',
    eyeState: 'squint',
    lookDirection: 'center',
    mouthExpression: 'wide-open',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: true,
    showPhone: false,
    showFartCloud: false,
  },
  'taking-selfie': {
    bodyColor: '#FF8A65',
    bodyHighlight: '#FFAB91',
    tentacleColor: '#FF8A65',
    eyeState: 'normal',
    lookDirection: 'center',
    mouthExpression: 'smile',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: true,
    showFartCloud: false,
  },
  farting: {
    bodyColor: '#8D6E63',
    bodyHighlight: '#A1887F',
    tentacleColor: '#8D6E63',
    eyeState: 'normal',
    lookDirection: 'left',
    mouthExpression: 'neutral',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: true,
  },
};

export default {
  name: 'TaskinMascotComposed',
  props: {
    size: {
      type: Number as PropType<number>,
      default: 340,
    },
    mood: {
      type: String as PropType<TaskinMood>,
      default: 'neutral',
    },
    idleAnimation: {
      type: Boolean,
      default: true,
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    eyeTrackingMode: {
      type: String as PropType<'none' | 'mouse' | 'element' | 'custom'>,
      default: undefined,
    },
    eyeTrackingBounds: {
      type: Number,
      default: undefined,
    },
    eyeLookDirection: {
      type: String as PropType<'center' | 'left' | 'right' | 'up' | 'down'>,
      default: undefined,
    },
    eyeTargetElement: {
      type: [Object, String] as PropType<HTMLElement | string>,
      default: undefined,
    },
    eyeCustomPosition: {
      type: Object as PropType<{ x: number; y: number }>,
      default: undefined,
    },
    eyeState: {
      type: String as PropType<'normal' | 'closed' | 'squint' | 'wide'>,
      default: undefined,
    },
    mouthExpression: {
      type: String as PropType<MouthExpression>,
      default: undefined,
    },
  },
  setup(props: {
    mood: TaskinMood;
    size: number;
    idleAnimation: boolean;
    animationsEnabled: boolean;
    eyeTrackingMode?: 'none' | 'mouse' | 'element' | 'custom';
    eyeTrackingBounds?: number;
    eyeLookDirection?: 'center' | 'left' | 'right' | 'up' | 'down';
    eyeTargetElement?: HTMLElement | string;
    eyeCustomPosition?: { x: number; y: number };
    eyeState?: 'normal' | 'closed' | 'squint' | 'wide';
    mouthExpression?: MouthExpression;
  }) {
    const config = computed(
      () => MOOD_CONFIGS[props.mood] || MOOD_CONFIGS.neutral,
    );
    const idleTimer = ref<number | null>(null);
    const blinkEyes = ref(false);
    const wiggleTentacles = ref(false);

    const setupIdleAnimation = () => {
      if (!props.idleAnimation || !props.animationsEnabled) return;
      if (idleTimer.value !== null) return;

      idleTimer.value = window.setInterval(() => {
        if (!props.animationsEnabled) return;
        const chance = Math.random();
        if (chance < 0.3) {
          // Blink
          blinkEyes.value = true;
          setTimeout(() => {
            blinkEyes.value = false;
          }, 150);
        } else if (chance < 0.6) {
          // Wiggle tentacles
          wiggleTentacles.value = true;
          setTimeout(() => {
            wiggleTentacles.value = false;
          }, 800);
        }
      }, 3500);
    };

    const clearIdleAnimation = () => {
      if (idleTimer.value !== null) {
        window.clearInterval(idleTimer.value);
        idleTimer.value = null;
      }
    };

    onMounted(() => {
      setupIdleAnimation();
    });

    onUnmounted(() => {
      clearIdleAnimation();
    });

    return () => {
      const components = [
        // Shadow
        h('ellipse', {
          cx: '160',
          cy: '230',
          rx: '70',
          ry: '14',
          fill: '#d8e2f0',
        }),
        // Fluid Tentacles (back layer) - connected to body bottom
        h('g', { transform: 'translate(160, 168)' }, [
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed:
              props.mood === 'dancing'
                ? 1.5
                : props.mood === 'tired'
                  ? 0.6
                  : props.mood === 'sleeping'
                    ? 0
                    : 1,
            fluid: true,
            translateX: -30,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed:
              props.mood === 'dancing'
                ? 1.8
                : props.mood === 'tired'
                  ? 0.5
                  : props.mood === 'sleeping'
                    ? 0
                    : 1.1,
            fluid: true,
            translateX: -10,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed:
              props.mood === 'dancing'
                ? 1.6
                : props.mood === 'tired'
                  ? 0.7
                  : props.mood === 'sleeping'
                    ? 0
                    : 0.9,
            fluid: true,
            translateX: 10,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled && wiggleTentacles.value,
            speed:
              props.mood === 'dancing'
                ? 1.7
                : props.mood === 'tired'
                  ? 0.6
                  : props.mood === 'sleeping'
                    ? 0
                    : 1.0,
            fluid: true,
            translateX: 30,
            translateY: 0,
          }),
        ]),
        // Body
        h(TaskinBody, {
          bodyColor: config.value.bodyColor,
          bodyHighlight: config.value.bodyHighlight,
          animationsEnabled: props.animationsEnabled,
          shiver: props.mood === 'cold',
          pant: props.mood === 'hot',
          dance: props.mood === 'dancing',
          float: props.mood === 'in-love',
          sway: props.mood === 'tired',
        }),
        // Arms - use TaskinArmWithPhone when taking selfie
        config.value.showPhone
          ? h(TaskinArmWithPhone, {
              color: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              itemOnRight: true,
            })
          : h(TaskinArms, {
              color: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
            }),
        // Eyes
        h(TaskinEyes, {
          state:
            props.eyeState ??
            (blinkEyes.value ? 'closed' : config.value.eyeState),
          trackingMode: props.eyeTrackingMode ?? 'none',
          trackingBounds: props.eyeTrackingBounds,
          lookDirection: props.eyeLookDirection ?? config.value.lookDirection,
          targetElement: props.eyeTargetElement,
          customPosition: props.eyeCustomPosition,
          animationsEnabled: props.animationsEnabled,
        }),
        // Mouth
        h(TaskinMouth, {
          expression:
            props.mouthExpression !== undefined
              ? props.mouthExpression
              : config.value.mouthExpression,
          animationsEnabled: props.animationsEnabled,
        }),
        // Effects
        config.value.showTears &&
          h(TaskinEffectTears, {
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showHearts &&
          h(TaskinEffectHearts, {
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showZzz &&
          h(TaskinEffectZzz, {
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showThoughtBubble &&
          h(TaskinEffectThoughtBubble, {
            text: config.value.thoughtBubbleText || '?',
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showVomit &&
          h(TaskinEffectVomit, {
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showFartCloud &&
          h(TaskinEffectFartCloud, {
            animationsEnabled: props.animationsEnabled,
          }),
      ].filter(Boolean);

      return h(
        'div',
        {
          class: 'taskin-mascot-composed',
          style: {
            display: 'inline-block',
            position: 'relative',
          },
        },
        h(
          'svg',
          {
            width: props.size,
            height: (props.size * 260) / 320,
            viewBox: '0 0 320 260',
            style: { display: 'block' },
          },
          components,
        ),
      );
    };
  },
};
