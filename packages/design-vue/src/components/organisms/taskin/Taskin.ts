import { computed, defineComponent, h, onMounted, onUnmounted, type PropType, ref } from 'vue';
import TaskinArms from '../../atoms/taskin-arms/TaskinArms.vue';
import type { EyeState } from '../../atoms/taskin-eyes/TaskinEyes.types';
import TaskinEyes from '../../atoms/taskin-eyes/TaskinEyes.vue';
import type { MouthExpression } from '../../atoms/taskin-mouth/TaskinMouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/TaskinMouth.vue';
import TaskinArmWithPhone from '../../molecules/taskin-arm-with-phone/TaskinArmWithPhone.vue';
import TaskinEffectFartCloud from '../../molecules/taskin-effect-fart-cloud/TaskinEffectFartCloud';
import TaskinEffectFly from '../../molecules/taskin-effect-fly/TaskinEffectFly';
import TaskinEffectHearts from '../../molecules/taskin-effect-hearts/TaskinEffectHearts';
import TaskinEffectInk from '../../molecules/taskin-effect-ink/TaskinEffectInk';
import TaskinEffectJuggle from '../../molecules/taskin-effect-juggle/TaskinEffectJuggle';
import type { JuggleBalls } from '../../molecules/taskin-effect-juggle/TaskinEffectJuggle.types';
import TaskinEffectSpeechBubble from '../../molecules/taskin-effect-speech-bubble/TaskinEffectSpeechBubble';
import TaskinEffectSweat from '../../molecules/taskin-effect-sweat/TaskinEffectSweat';
import TaskinEffectTears from '../../molecules/taskin-effect-tears/TaskinEffectTears';
import TaskinEffectThoughtBubble from '../../molecules/taskin-effect-thought-bubble/TaskinEffectThoughtBubble';
import TaskinEffectVomit from '../../molecules/taskin-effect-vomit/TaskinEffectVomit';
import TaskinEffectWeight from '../../molecules/taskin-effect-weight/TaskinEffectWeight';
import TaskinEffectZzz from '../../molecules/taskin-effect-zzz/TaskinEffectZzz';
import type {
  ActionConfig,
  ActionPose,
  CharacterPartProps,
  LookDirection,
  MoodColors,
  TaskinCharacter,
} from './character/character.types';
import { TASKIN_CHARACTER } from './characters/taskin/taskin-character';
import type { TaskinAction } from './Taskin.actions';
import type { TaskinMood } from './Taskin.types';

/** Sem cor propria, o humor usa a cor de base da personagem (`character.colors`). */
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
 * Quanto uma acao dura, sem toca-la: e o que deixa o mapa de tarefas casar o
 * trajeto com o pulo ou o nado da personagem, que se mexe no lugar. A acao
 * que a personagem nao tem dura zero, porque `play` resolve na hora.
 */
export function actionDuration(character: TaskinCharacter, action: TaskinAction): number {
  return character.actions[action]?.durationMs ?? 0;
}

/** A acao que esta rodando, com o que e preciso para encerra-la. */
interface RunningAction {
  action: TaskinAction;
  config: ActionConfig;
  timer: ReturnType<typeof setTimeout>;
  /** Os timers dos passos de `steps`, e o que eles ja trocaram na pose. */
  stepTimers: ReturnType<typeof setTimeout>[];
  stepPose: ActionPose;
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
     * Quem o mascote e: o polvo Taskin (padrao) ou qualquer personagem feita
     * com `defineCharacter`. Os humores, o ocioso, o rastreio dos olhos, a fala,
     * as acoes e os efeitos sao do motor; o desenho e as ancoras, da personagem.
     */
    character: {
      type: Object as PropType<TaskinCharacter>,
      default: () => TASKIN_CHARACTER,
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
    /**
     * O que o mascote esta dizendo: com texto, o balao de fala aparece saindo
     * da boca, e o de pensamento sai de cena — falar ganha de pensar. Vazio,
     * nada muda. A boca so se mexe com `speaking`; sao coisas separadas.
     */
    speechText: {
      type: String,
      default: undefined,
    },
    /** O microfone esta ligado: o mascote fica na pose de escuta enquanto for `true`. */
    listening: {
      type: Boolean,
      default: false,
    },
    /** Ha fala tocando: a boca acompanha, e a personagem pode reagir (`motion.speakingClass`). */
    speaking: {
      type: Boolean,
      default: false,
    },
    /**
     * Quantas bolinhas o mascote tem no ar: o aviso de tasks demais em andamento.
     * Dura enquanto durar a prop. So personagens com `motion.jugglingClass`
     * fazem malabarismo; as outras ignoram.
     */
    juggling: {
      type: Number as PropType<JuggleBalls>,
      default: 0,
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
      const doHumor = { ...props.character.colors, ...(MOOD_CONFIGS[props.mood] || MOOD_CONFIGS.neutral) };
      if (props.showThoughtBubble === undefined && props.thoughtBubbleText === undefined) return doHumor;

      return {
        ...doHumor,
        showThoughtBubble: props.showThoughtBubble ?? doHumor.showThoughtBubble,
        thoughtBubbleText: props.thoughtBubbleText ?? doHumor.thoughtBubbleText,
      };
    });
    const idleTimer = ref<number | null>(null);
    const blinkEyes = ref(false);
    /** O gesto ocioso: o polvo mexe um tentaculo, o sapo bate os dedos. Cada personagem desenha o seu. */
    const fidgeting = ref(false);

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
          fidgeting.value = true;
          setTimeout(() => {
            fidgeting.value = false;
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
      current.stepTimers.forEach(clearTimeout);
      running.value = null;
      emit('action-end', { action: current.action, completed });
      current.resolve(completed);
    };

    /**
     * Faz a acao uma vez e devolve o bicho ao humor. Resolve `true` quando ela
     * termina; `false` quando outra a interrompe, o componente sai da tela ou a
     * personagem nao tem a acao. Sem animacao, nao ha classe, mas o tempo e o mesmo.
     */
    const play = (action: TaskinAction): Promise<boolean> => {
      const config = props.character.actions[action];
      if (!config) return Promise.resolve(false);
      endAction(false);

      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => endAction(true), config.durationMs);
        const stepTimers = (config.steps ?? []).map((step) =>
          setTimeout(() => {
            if (running.value) running.value.stepPose = { ...running.value.stepPose, ...step.pose };
          }, step.atMs),
        );
        running.value = { action, config, timer, stepTimers, stepPose: {}, resolve };
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
      const character = props.character;
      const pose: ActionPose = running.value
        ? { ...running.value.config.pose, ...running.value.stepPose }
        : props.listening
          ? character.listening
          : {};
      const action = running.value?.action ?? null;

      const shadow = h('ellipse', {
        cx: '160',
        cy: '230',
        rx: String(character.shadow.rx),
        ry: String(character.shadow.ry),
        fill: character.shadow.fill,
      });

      // O que as partes desenhadas da personagem recebem a cada quadro.
      const partProps: CharacterPartProps = {
        character,
        colors: {
          bodyColor: config.value.bodyColor,
          bodyHighlight: config.value.bodyHighlight,
          tentacleColor: config.value.tentacleColor,
        },
        mood: props.mood,
        animationsEnabled: props.animationsEnabled,
        fidgeting: fidgeting.value,
        action,
        speaking: props.speaking,
      };
      const { back, body, front } = character.parts;

      const mascot = [
        // Atras do corpo (os tentaculos do polvo).
        back && h(back, partProps),
        // O corpo. Sem `float` nem `sway`: o bicho se mexe inteiro pelo grupo de
        // movimento, e nao so o corpo.
        h(body, partProps),
        // Arms - use TaskinArmWithPhone when taking selfie
        config.value.showPhone
          ? h(TaskinArmWithPhone, {
              armColor: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              itemOnRight: true,
            })
          : h(TaskinArms, {
              geometry: character.arms,
              color: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              leftArmPosition: pose.leftArm,
              rightArmPosition: pose.rightArm,
            }),
        // Eyes. A `key` remonta os olhos na troca de personagem: o rastreio le
        // os centros deles uma vez so, no setup.
        h(TaskinEyes, {
          key: character.id,
          geometry: character.eyes,
          state: props.eyeState ?? pose.eyeState ?? (blinkEyes.value ? 'closed' : config.value.eyeState),
          trackingMode: props.eyeTrackingMode ?? 'none',
          trackingBounds: props.eyeTrackingBounds,
          lookDirection: props.eyeLookDirection ?? pose.lookDirection ?? config.value.lookDirection,
          targetElement: props.eyeTargetElement,
          customPosition: props.eyeCustomPosition,
          animationsEnabled: props.animationsEnabled,
        }),
        h(TaskinMouth, {
          offset: character.mouth.offset,
          ink: character.mouth.ink,
          expression: props.mouthExpression ?? pose.mouthExpression ?? config.value.mouthExpression,
          animationsEnabled: props.animationsEnabled,
          speaking: props.speaking,
        }),
        // Na frente da boca (a lingua do sapo).
        front && h(front, partProps),
        // Effects
        config.value.showTears && h(TaskinEffectTears, { character, animationsEnabled: props.animationsEnabled }),
        config.value.showHearts && h(TaskinEffectHearts, { character, animationsEnabled: props.animationsEnabled }),
        config.value.showZzz && h(TaskinEffectZzz, { character, animationsEnabled: props.animationsEnabled }),
        config.value.showThoughtBubble &&
          !props.speechText &&
          h(TaskinEffectThoughtBubble, {
            character,
            text: config.value.thoughtBubbleText || '?',
            animationsEnabled: props.animationsEnabled,
          }),
        props.speechText &&
          h(TaskinEffectSpeechBubble, {
            character,
            text: props.speechText,
            animationsEnabled: props.animationsEnabled,
          }),
        config.value.showVomit && h(TaskinEffectVomit, { character, animationsEnabled: props.animationsEnabled }),
        config.value.showFartCloud && h(TaskinEffectFartCloud, { animationsEnabled: props.animationsEnabled }),
        character.motion.jugglingClass &&
          props.juggling > 0 &&
          h(TaskinEffectJuggle, { balls: props.juggling, animationsEnabled: props.animationsEnabled }),
        action === 'catch-fly' && h(TaskinEffectFly, { animationsEnabled: props.animationsEnabled }),
        action === 'effort' && h(TaskinEffectWeight, { character, animationsEnabled: props.animationsEnabled }),
        (config.value.showSweat || action === 'effort') &&
          h(TaskinEffectSweat, { character, animationsEnabled: props.animationsEnabled }),
      ].filter(Boolean);

      const { byMood, css, listeningClass, speakingClass, jugglingClass } = character.motion;
      // A acao, enquanto roda, toma o lugar da escuta, e a escuta o do humor.
      const idle = props.listening ? listeningClass : byMood[props.mood];
      const motion = props.animationsEnabled ? (running.value?.config.className ?? idle) : undefined;
      const components = [
        shadow,
        // A tinta, fora do grupo de movimento: fica onde saiu enquanto o polvo da
        // o tranco para cima, e atras dele, porque vem antes do corpo.
        action === 'ink' && h(TaskinEffectInk, { animationsEnabled: props.animationsEnabled }),
        h(
          'g',
          {
            id: `${character.id}-motion`,
            class: [
              `${character.id}-motion`,
              motion,
              props.animationsEnabled && props.speaking && speakingClass,
              // Os bracos sobem e descem alternados, no ritmo das bolinhas. As
              // acoes que mexem num braco vem depois no CSS e ganham dele.
              props.animationsEnabled && props.juggling > 0 && jugglingClass,
            ],
          },
          mascot,
        ),
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
            'data-character': character.id,
          },
          components,
        ),
      );
    };
  },
});
