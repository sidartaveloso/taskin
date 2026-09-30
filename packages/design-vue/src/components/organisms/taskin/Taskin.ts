import { computed, defineComponent, h, onMounted, onUnmounted, type PropType, ref } from 'vue';
import { type ArmPosition, armPosition } from '../../atoms/taskin-arms/TaskinArms.types';
import TaskinArms from '../../atoms/taskin-arms/TaskinArms.vue';
import TaskinBody from '../../atoms/taskin-body/TaskinBody.vue';
import type { EyeState } from '../../atoms/taskin-eyes/TaskinEyes.types';
import TaskinEyes from '../../atoms/taskin-eyes/TaskinEyes.vue';
import type { MouthExpression } from '../../atoms/taskin-mouth/TaskinMouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/TaskinMouth.vue';
import TaskinArmWithPhone from '../../molecules/taskin-arm-with-phone/TaskinArmWithPhone.vue';
import TaskinEffectFartCloud from '../../molecules/taskin-effect-fart-cloud/TaskinEffectFartCloud';
import TaskinEffectHearts from '../../molecules/taskin-effect-hearts/TaskinEffectHearts';
import TaskinEffectSweat from '../../molecules/taskin-effect-sweat/TaskinEffectSweat';
import TaskinEffectTears from '../../molecules/taskin-effect-tears/TaskinEffectTears';
import TaskinEffectThoughtBubble from '../../molecules/taskin-effect-thought-bubble/TaskinEffectThoughtBubble';
import TaskinEffectVomit from '../../molecules/taskin-effect-vomit/TaskinEffectVomit';
import TaskinEffectZzz from '../../molecules/taskin-effect-zzz/TaskinEffectZzz';
import TaskinTentacleWithItem from '../../molecules/taskin-tentacle-with-item/TaskinTentacleWithItem.vue';
import type { TaskinAction } from './Taskin.actions';
import type { TaskinMood } from './Taskin.types';
import type { TaskinVariant } from './Taskin.variants';

type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down';

interface MoodColors {
  bodyColor: string;
  bodyHighlight: string;
  tentacleColor: string;
}

/** Sem cor propria, o humor usa a cor de base da variante (`BASE_COLORS`). */
interface MoodConfig extends Partial<MoodColors> {
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
  /** Gotas de suor em volta da cabeca: o calor. */
  showSweat: boolean;
}

/**
 * A cor de base de cada variante: o azul do polvo, o verde do sapo. Os humores
 * sem cor propria (`neutral`, `smirk`, `annoyed`, `sarcastic`) usam esta; os
 * outros trocam a cor inteira nas duas variantes, como o polvo se camuflando.
 *
 * O Sapin nao desenha o brilho do polvo: a barriga clara sai de um branco
 * translucido por cima da cor do corpo, e por isso acompanha qualquer humor.
 */
const BASE_COLORS: Record<TaskinVariant, MoodColors> = {
  taskin: { bodyColor: '#1f7acb', bodyHighlight: '#2090e0', tentacleColor: '#1f7acb' },
  sapin: { bodyColor: '#4DB848', bodyHighlight: '#CDEEC8', tentacleColor: '#4DB848' },
};

/**
 * Como o Taskin se mexe em cada humor: o polvo inteiro, e nao so o corpo —
 * tentaculos, bracos, olhos, boca e efeitos juntos, porque o rosto mora no
 * corpo e os tentaculos saem de baixo dele. Danca de um lado para o outro,
 * flutua apaixonado, balanca cansado, treme com frio e arfa com calor. Dormindo
 * fica parado. Os tentaculos seguem com o ritmo proprio de cada humor por cima.
 */
const TASKIN_MOTION_BY_MOOD: Partial<Record<TaskinMood, string>> = {
  dancing: 'taskin-dance',
  'in-love': 'taskin-float',
  tired: 'taskin-sway',
  cold: 'taskin-shiver',
  hot: 'taskin-pant',
};

// O giro e a escala sao em volta do centro do corpo, em coordenadas do viewBox,
// como no `dance()` do controller. O `fill-box` do Sapin nao serve aqui: com os
// tentaculos ondulando dentro do grupo, a caixa — e o eixo — mudaria a cada
// quadro. Os valores de danca e tremor tambem vem do controller. O arfar e curto
// e rapido, no passo da lingua (`TaskinMouth`): inchando devagar, parecia suspiro.
const TASKIN_MOTION_CSS = `
  .taskin-motion { transform-box: view-box; transform-origin: 160px 110px; }
  .taskin-dance { animation: taskin-taskin-dance 0.8s ease-in-out infinite; }
  .taskin-float { animation: taskin-taskin-float 3s ease-in-out infinite; }
  .taskin-sway { animation: taskin-taskin-sway 2s ease-in-out infinite; }
  .taskin-shiver { animation: taskin-taskin-shiver 0.2s linear infinite; }
  .taskin-pant { animation: taskin-taskin-pant 0.4s ease-in-out infinite; }
  .taskin-nod { animation: taskin-taskin-nod 0.7s ease-in-out; animation-iteration-count: 1; }
  .taskin-shake { animation: taskin-taskin-shake 0.7s ease-in-out; animation-iteration-count: 1; }
  .taskin-celebrate { animation: taskin-taskin-celebrate 1.2s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-taskin-dance {
    0%, 50%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(-5px, -3px) rotate(-5deg); }
    75% { transform: translate(5px, -3px) rotate(5deg); }
  }
  @keyframes taskin-taskin-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes taskin-taskin-sway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-2deg); }
    75% { transform: rotate(2deg); }
  }
  @keyframes taskin-taskin-shiver {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
  @keyframes taskin-taskin-pant {
    0%, 100% { transform: scale(1, 1); }
    50% { transform: scale(1.02, 0.97); }
  }
  @keyframes taskin-taskin-nod {
    0%, 50%, 100% { transform: translateY(0) scale(1, 1); }
    25%, 75% { transform: translateY(8px) scale(1.02, 0.94); }
  }
  @keyframes taskin-taskin-shake {
    0%, 100% { transform: rotate(0deg); }
    8%, 42%, 75% { transform: rotate(-8deg); }
    25%, 58%, 92% { transform: rotate(8deg); }
  }
  @keyframes taskin-taskin-celebrate {
    0%, 100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
    15% { transform: translateY(4px) rotate(0deg) scale(1.03, 0.95); }
    40% { transform: translateY(-18px) rotate(-12deg) scale(0.98, 1.03); }
    70% { transform: translateY(-6px) rotate(6deg) scale(1, 1); }
    85% { transform: translateY(2px) rotate(0deg) scale(1.03, 0.96); }
  }
  @media (prefers-reduced-motion: reduce) {
    .taskin-motion { animation-name: none !important; }
  }
`;

/**
 * Como o Sapin se mexe em cada humor. O sapo mexe o corpo inteiro — olhos, boca
 * e efeitos juntos, porque os olhos moram nos calombos da cabeca: pula dancando,
 * flutua apaixonado, balanca cansado, treme com frio e arfa com calor. Dormindo
 * fica parado, como o Taskin.
 */
const SAPIN_MOTION_BY_MOOD: Partial<Record<TaskinMood, string>> = {
  dancing: 'sapin-hop',
  'in-love': 'sapin-float',
  tired: 'sapin-sway',
  cold: 'sapin-shiver',
  hot: 'sapin-pant',
};

// Nomes com prefixo: o `<style>` dentro do SVG vale para o documento inteiro.
const SAPIN_MOTION_CSS = `
  .sapin-motion { transform-box: fill-box; transform-origin: 50% 100%; }
  .sapin-hop { animation: taskin-sapin-hop 0.6s ease-in-out infinite; }
  .sapin-float { animation: taskin-sapin-float 3s ease-in-out infinite; }
  .sapin-sway { animation: taskin-sapin-sway 2.4s ease-in-out infinite; }
  .sapin-shiver { animation: taskin-sapin-shiver 0.15s linear infinite; }
  .sapin-pant { animation: taskin-sapin-pant 0.5s ease-in-out infinite; }
  .sapin-nod { animation: taskin-sapin-nod 0.7s ease-in-out; animation-iteration-count: 1; }
  .sapin-shake { animation: taskin-sapin-shake 0.7s ease-in-out; animation-iteration-count: 1; }
  .sapin-celebrate { animation: taskin-sapin-celebrate 1.2s ease-in-out; animation-iteration-count: 1; }
  .sapin-celebrate #body-throat { animation: taskin-sapin-throat 1.2s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-sapin-hop {
    0%, 100% { transform: translateY(0) scale(1.04, 0.96); }
    15%, 85% { transform: translateY(0) scale(1, 1); }
    50% { transform: translateY(-16px) scale(0.98, 1.03); }
  }
  @keyframes taskin-sapin-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes taskin-sapin-sway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }
  @keyframes taskin-sapin-shiver {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-1.5px); }
    75% { transform: translateX(1.5px); }
  }
  @keyframes taskin-sapin-pant {
    0%, 100% { transform: scale(1, 1); }
    50% { transform: scale(1.03, 0.97); }
  }
  @keyframes taskin-sapin-nod {
    0%, 50%, 100% { transform: translateY(0) scale(1, 1); }
    25%, 75% { transform: translateY(4px) scale(1.03, 0.9); }
  }
  @keyframes taskin-sapin-shake {
    0%, 100% { transform: rotate(0deg); }
    8%, 42%, 75% { transform: rotate(-6deg); }
    25%, 58%, 92% { transform: rotate(6deg); }
  }
  @keyframes taskin-sapin-celebrate {
    0%, 100% { transform: translateY(0) scale(1, 1); }
    20% { transform: translateY(0) scale(1.06, 0.92); }
    45%, 55% { transform: translateY(-24px) scale(0.97, 1.04); }
    80% { transform: translateY(0) scale(1.06, 0.92); }
  }
  @keyframes taskin-sapin-throat {
    0%, 30%, 80%, 100% { transform: scale(0); }
    45%, 55% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sapin-motion { animation-name: none !important; }
    .sapin-motion #body-throat { animation-name: none !important; }
  }
`;

/**
 * O movimento de cada variante. O bicho vai inteiro num grupo so,
 * `#taskin-motion` ou `#sapin-motion`; a sombra fica fora dele, no chao.
 */
const MOTIONS: Record<TaskinVariant, { byMood: Partial<Record<TaskinMood, string>>; css: string }> = {
  taskin: { byMood: TASKIN_MOTION_BY_MOOD, css: TASKIN_MOTION_CSS },
  sapin: { byMood: SAPIN_MOTION_BY_MOOD, css: SAPIN_MOTION_CSS },
};

/**
 * O que uma acao impoe enquanto roda, por cima do humor. A prop explicita do
 * consumidor ainda ganha dela.
 */
interface ActionPose {
  leftArm?: ArmPosition;
  rightArm?: ArmPosition;
  eyeState?: EyeState;
  lookDirection?: LookDirection;
  mouthExpression?: MouthExpression;
}

interface ActionConfig {
  /** Entra no `#<variante>-motion` enquanto a acao roda, no lugar da do humor. */
  className: string;
  /** O fim, por timer: aba oculta congela a animacao e o `animationend` nao viria. */
  durationMs: number;
  pose?: ActionPose;
}

/** Os dois bracos para o alto, sorrindo: a comemoracao. */
const celebratePose = (shoulder: number, forearm: number): ActionPose => ({
  leftArm: armPosition(shoulder, forearm),
  rightArm: armPosition(shoulder, forearm),
  mouthExpression: 'smile',
});

/**
 * As acoes de cada variante. A que falta numa variante resolve `false` na hora:
 * e o que deixa uma acao existir so num dos bichos.
 */
export const ACTIONS: Record<TaskinVariant, Partial<Record<TaskinAction, ActionConfig>>> = {
  taskin: {
    nod: { className: 'taskin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'taskin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'taskin-celebrate', durationMs: 1200, pose: celebratePose(-70, -100) },
  },
  sapin: {
    nod: { className: 'sapin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'sapin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'sapin-celebrate', durationMs: 1200, pose: celebratePose(-60, -100) },
  },
};

/** A acao que esta rodando, com o que e preciso para encerra-la. */
interface RunningAction {
  action: TaskinAction;
  config: ActionConfig;
  timer: ReturnType<typeof setTimeout>;
  resolve: (completed: boolean) => void;
}

const MOOD_CONFIGS: Record<TaskinMood, MoodConfig> = {
  neutral: {
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
    showSweat: false,
  },
  smirk: {
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
    showSweat: false,
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
    showSweat: false,
  },
  annoyed: {
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
    showSweat: false,
  },
  sarcastic: {
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
  },
  // Com calor, e nao contente: olhos pesados, lingua para fora e suor. Com
  // olho normal e a boca escancarada do `wide-open`, o humor parecia feliz.
  hot: {
    bodyColor: '#FF6B6B',
    bodyHighlight: '#FFA07A',
    tentacleColor: '#FF6B6B',
    eyeState: 'squint',
    lookDirection: 'center',
    mouthExpression: 'panting',
    showTears: false,
    showHearts: false,
    showZzz: false,
    showThoughtBubble: false,
    showVomit: false,
    showPhone: false,
    showFartCloud: false,
    showSweat: true,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
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
    showSweat: false,
  },
};

export default defineComponent({
  name: 'Taskin',
  props: {
    size: {
      type: Number as PropType<number>,
      default: 340,
    },
    mood: {
      type: String as PropType<TaskinMood>,
      default: 'neutral',
    },
    /**
     * O bicho que o mascote desenha: o polvo Taskin ou o sapinho Sapin. Os
     * humores, o ocioso, o rastreio dos olhos e os efeitos sao os mesmos.
     */
    variant: {
      type: String as PropType<TaskinVariant>,
      default: 'taskin',
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
    /**
     * Mostra o balao de pensamento independentemente do humor. Sem isto so o
     * humor `thoughtful` tinha balao, e sempre com o mesmo `?`.
     */
    showThoughtBubble: {
      type: Boolean,
      default: undefined,
    },
    /** O que vai escrito no balao. */
    thoughtBubbleText: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    'action-start': (_action: TaskinAction) => true,
    'action-end': (_payload: { action: TaskinAction; completed: boolean }) => true,
  },
  setup(props, { emit, expose }) {
    /**
     * O humor traz a configuracao base; as props de balao, quando vem, mandam
     * nela. E o que permite o mascote dizer "Bruno, Shhhhhhhhhhhh..." em vez do
     * `?` fixo que o humor `thoughtful` carrega.
     */
    const config = computed(() => {
      const doHumor = { ...BASE_COLORS[props.variant], ...(MOOD_CONFIGS[props.mood] || MOOD_CONFIGS.neutral) };
      if (props.showThoughtBubble === undefined && props.thoughtBubbleText === undefined) return doHumor;

      return {
        ...doHumor,
        showThoughtBubble: props.showThoughtBubble ?? doHumor.showThoughtBubble,
        thoughtBubbleText: props.thoughtBubbleText ?? doHumor.thoughtBubbleText,
      };
    });
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

    const running = ref<RunningAction | null>(null);

    const endAction = (completed: boolean) => {
      const current = running.value;
      if (!current) return;
      clearTimeout(current.timer);
      running.value = null;
      emit('action-end', { action: current.action, completed });
      current.resolve(completed);
    };

    /**
     * Faz a acao uma vez e devolve o bicho ao humor. Resolve `true` quando ela
     * termina; `false` quando outra a interrompe, o componente sai da tela ou a
     * variante nao tem a acao. Sem animacao, nao ha classe, mas o tempo e o mesmo.
     */
    const play = (action: TaskinAction): Promise<boolean> => {
      const config = ACTIONS[props.variant][action];
      if (!config) return Promise.resolve(false);
      endAction(false);

      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => endAction(true), config.durationMs);
        running.value = { action, config, timer, resolve };
        emit('action-start', action);
      });
    };

    expose({ play });

    onMounted(() => {
      setupIdleAnimation();
    });

    onUnmounted(() => {
      clearIdleAnimation();
      endAction(false);
    });

    return () => {
      const sapin = props.variant === 'sapin';
      const variant = props.variant;
      const pose = running.value?.config.pose ?? {};

      // Shadow
      const shadow = h('ellipse', {
        cx: '160',
        cy: '230',
        rx: sapin ? '82' : '70',
        ry: sapin ? '13' : '14',
        // A sombra do Sapin, na referencia, e mais clara e mais cinza.
        fill: sapin ? '#E4E9ED' : '#d8e2f0',
      });

      // Fluid Tentacles (back layer) - connected to body bottom. O Sapin tem
      // pernas, que o corpo dele ja desenha.
      const tentacles =
        !sapin &&
        h('g', { transform: 'translate(160, 168)' }, [
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed: props.mood === 'dancing' ? 1.5 : props.mood === 'tired' ? 0.6 : props.mood === 'sleeping' ? 0 : 1,
            fluid: true,
            translateX: -30,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed: props.mood === 'dancing' ? 1.8 : props.mood === 'tired' ? 0.5 : props.mood === 'sleeping' ? 0 : 1.1,
            fluid: true,
            translateX: -10,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled,
            speed: props.mood === 'dancing' ? 1.6 : props.mood === 'tired' ? 0.7 : props.mood === 'sleeping' ? 0 : 0.9,
            fluid: true,
            translateX: 10,
            translateY: 0,
          }),
          h(TaskinTentacleWithItem, {
            tentacleColor: config.value.tentacleColor,
            animationsEnabled: props.animationsEnabled && wiggleTentacles.value,
            speed: props.mood === 'dancing' ? 1.7 : props.mood === 'tired' ? 0.6 : props.mood === 'sleeping' ? 0 : 1.0,
            fluid: true,
            translateX: 30,
            translateY: 0,
          }),
        ]);

      const mascot = [
        tentacles,
        // Body. Sem `float` nem `sway`: o bicho se mexe inteiro pelo grupo de
        // movimento, e nao so o corpo. No ocioso, o Sapin bate os dedos.
        h(TaskinBody, {
          variant,
          bodyColor: config.value.bodyColor,
          bodyHighlight: config.value.bodyHighlight,
          animationsEnabled: props.animationsEnabled,
          tapToes: sapin && wiggleTentacles.value,
        }),
        // Arms - use TaskinArmWithPhone when taking selfie
        config.value.showPhone
          ? h(TaskinArmWithPhone, {
              armColor: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              itemOnRight: true,
            })
          : h(TaskinArms, {
              variant,
              color: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              leftArmPosition: pose.leftArm,
              rightArmPosition: pose.rightArm,
            }),
        // Eyes. A `key` remonta os olhos na troca de variante: o rastreio le
        // os centros deles uma vez so, no setup.
        h(TaskinEyes, {
          key: variant,
          variant,
          state: props.eyeState ?? pose.eyeState ?? (blinkEyes.value ? 'closed' : config.value.eyeState),
          trackingMode: props.eyeTrackingMode ?? 'none',
          trackingBounds: props.eyeTrackingBounds,
          lookDirection: props.eyeLookDirection ?? pose.lookDirection ?? config.value.lookDirection,
          targetElement: props.eyeTargetElement,
          customPosition: props.eyeCustomPosition,
          animationsEnabled: props.animationsEnabled,
        }),
        // Mouth
        h(TaskinMouth, {
          variant,
          expression: props.mouthExpression ?? pose.mouthExpression ?? config.value.mouthExpression,
          animationsEnabled: props.animationsEnabled,
        }),
        // Effects
        config.value.showTears &&
          h(TaskinEffectTears, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showHearts &&
          h(TaskinEffectHearts, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showZzz &&
          h(TaskinEffectZzz, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showThoughtBubble &&
          h(TaskinEffectThoughtBubble, {
            variant,
            text: config.value.thoughtBubbleText || '?',
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showVomit &&
          h(TaskinEffectVomit, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showFartCloud &&
          h(TaskinEffectFartCloud, {
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showSweat &&
          h(TaskinEffectSweat, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
      ].filter(Boolean);

      const { byMood, css } = MOTIONS[variant];
      // A acao, enquanto roda, toma o lugar do movimento do humor.
      const motion = props.animationsEnabled ? (running.value?.config.className ?? byMood[props.mood]) : undefined;
      const components = [
        shadow,
        h('g', { id: `${variant}-motion`, class: [`${variant}-motion`, motion] }, mascot),
        h('style', css),
      ];

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
});
