import { computed, defineComponent, h, onMounted, onUnmounted, type PropType, ref } from 'vue';
import { type ArmPosition, armPosition } from '../../atoms/taskin-arms/TaskinArms.types';
import TaskinArms from '../../atoms/taskin-arms/TaskinArms.vue';
import TaskinBody from '../../atoms/taskin-body/TaskinBody.vue';
import type { EyeState } from '../../atoms/taskin-eyes/TaskinEyes.types';
import TaskinEyes from '../../atoms/taskin-eyes/TaskinEyes.vue';
import { MOUTH_OFFSET, type MouthExpression, mouthTransform } from '../../atoms/taskin-mouth/TaskinMouth.types';
import TaskinMouth from '../../atoms/taskin-mouth/TaskinMouth.vue';
import TaskinArmWithPhone from '../../molecules/taskin-arm-with-phone/TaskinArmWithPhone.vue';
import TaskinEffectFartCloud from '../../molecules/taskin-effect-fart-cloud/TaskinEffectFartCloud';
import TaskinEffectFly, { FLY_STOP } from '../../molecules/taskin-effect-fly/TaskinEffectFly';
import TaskinEffectHearts from '../../molecules/taskin-effect-hearts/TaskinEffectHearts';
import TaskinEffectJuggle from '../../molecules/taskin-effect-juggle/TaskinEffectJuggle';
import type { JuggleBalls } from '../../molecules/taskin-effect-juggle/TaskinEffectJuggle.types';
import TaskinEffectSweat from '../../molecules/taskin-effect-sweat/TaskinEffectSweat';
import TaskinEffectTears from '../../molecules/taskin-effect-tears/TaskinEffectTears';
import TaskinEffectThoughtBubble from '../../molecules/taskin-effect-thought-bubble/TaskinEffectThoughtBubble';
import TaskinEffectVomit from '../../molecules/taskin-effect-vomit/TaskinEffectVomit';
import TaskinEffectWeight from '../../molecules/taskin-effect-weight/TaskinEffectWeight';
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
  .taskin-point-up { animation: taskin-taskin-point-up 0.9s ease-in-out; animation-iteration-count: 1; }
  .taskin-point-down { animation: taskin-taskin-point-down 0.9s ease-in-out; animation-iteration-count: 1; }
  .taskin-juggling #left-arm,
  .taskin-juggling #right-arm { transform-box: view-box; animation: taskin-taskin-juggle-arm-left 0.8s ease-in-out infinite; }
  .taskin-juggling #left-arm { transform-origin: 95px 120px; }
  .taskin-juggling #right-arm { transform-origin: 225px 120px; animation-name: taskin-taskin-juggle-arm-right; animation-delay: -0.4s; }
  @keyframes taskin-taskin-juggle-arm-left {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(14deg); }
  }
  @keyframes taskin-taskin-juggle-arm-right {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-14deg); }
  }
  .taskin-start { animation: taskin-taskin-start 1.1s ease-in-out; animation-iteration-count: 1; }
  .taskin-start #left-arm {
    transform-box: view-box;
    transform-origin: 95px 120px;
    animation: taskin-taskin-start-arm-left 1.1s ease-in-out;
    animation-iteration-count: 1;
  }
  .taskin-start #right-arm {
    transform-box: view-box;
    transform-origin: 225px 120px;
    animation: taskin-taskin-start-arm-right 1.1s ease-in-out;
    animation-iteration-count: 1;
  }
  .taskin-blocked { animation: taskin-taskin-blocked 1.6s ease-in-out; animation-iteration-count: 1; }
  .taskin-effort { animation: taskin-taskin-effort 2s linear; }
  .taskin-wake { animation: taskin-taskin-wake 2s ease-in-out; animation-iteration-count: 1; transform-origin: 50% 100%; }
  @keyframes taskin-taskin-wake {
    0% { transform: scale(1, 1); }
    35%, 70% { transform: scale(0.97, 1.06); }
    100% { transform: scale(1, 1); }
  }
  .taskin-wave { animation: taskin-taskin-wave 1.4s ease-in-out; animation-iteration-count: 1; }
  .taskin-wave #right-arm {
    transform-box: view-box;
    transform-origin: 225px 120px;
    animation: taskin-taskin-wave-arm 1.4s ease-in-out;
    animation-iteration-count: 1;
  }
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
  @keyframes taskin-taskin-point-up {
    0%, 100% { transform: translateY(0); }
    30%, 70% { transform: translateY(-3px); }
  }
  @keyframes taskin-taskin-point-down {
    0%, 100% { transform: translateY(0); }
    30%, 70% { transform: translateY(3px); }
  }
  @keyframes taskin-taskin-start {
    0%, 100% { transform: translateY(0); }
    30%, 70% { transform: translateY(2px); }
  }
  @keyframes taskin-taskin-start-arm-left {
    0%, 100% { transform: rotate(0deg); }
    20%, 60% { transform: rotate(-14deg); }
    40%, 80% { transform: rotate(10deg); }
  }
  @keyframes taskin-taskin-start-arm-right {
    0%, 100% { transform: rotate(0deg); }
    20%, 60% { transform: rotate(14deg); }
    40%, 80% { transform: rotate(-10deg); }
  }
  @keyframes taskin-taskin-blocked {
    0%, 100% { transform: translateX(0); }
    15%, 40% { transform: translateX(-4px); }
    65% { transform: translateX(0); }
  }
  @keyframes taskin-taskin-effort {
    0% { transform: translate(0, 0); }
    10% { transform: translate(-1.5px, 0.75px); }
    20% { transform: translate(0, 0); }
    30% { transform: translate(1.5px, -0.75px); }
    40% { transform: translate(0, 0); }
    50% { transform: translate(-1.5px, 0.75px); }
    60% { transform: translate(0, 0); }
    70% { transform: translate(1.5px, -0.75px); }
    80% { transform: translate(0, 0); }
    90% { transform: translate(-1.5px, 0.75px); }
    100% { transform: translate(0, 0); }
  }
  @keyframes taskin-taskin-wave {
    0%, 100% { transform: rotate(0deg); }
    25%, 75% { transform: rotate(-1.5deg); }
    50% { transform: rotate(1.5deg); }
  }
  @keyframes taskin-taskin-wave-arm {
    0%, 100% { transform: rotate(0deg); }
    10%, 40%, 70% { transform: rotate(-15deg); }
    25%, 55%, 85% { transform: rotate(15deg); }
  }
  .taskin-travel-left { animation: taskin-taskin-travel-left 0.9s ease-in-out; animation-iteration-count: 1; }
  .taskin-travel-right { animation: taskin-taskin-travel-right 0.9s ease-in-out; animation-iteration-count: 1; }
  .taskin-travel-left #taskin-tentacles,
  .taskin-travel-right #taskin-tentacles { transform-box: view-box; transform-origin: 160px 168px; }
  .taskin-travel-left #taskin-tentacles { animation: taskin-taskin-travel-left-tentacles 0.9s ease-in-out; animation-iteration-count: 1; }
  .taskin-travel-right #taskin-tentacles { animation: taskin-taskin-travel-right-tentacles 0.9s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-taskin-travel-left {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    45% { transform: translateX(-6px) rotate(-12deg); }
  }
  @keyframes taskin-taskin-travel-right {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    45% { transform: translateX(6px) rotate(12deg); }
  }
  @keyframes taskin-taskin-travel-left-tentacles {
    0%, 100% { transform: translateX(0) skewX(0deg); }
    55% { transform: translateX(3px) skewX(14deg); }
  }
  @keyframes taskin-taskin-travel-right-tentacles {
    0%, 100% { transform: translateX(0) skewX(0deg); }
    55% { transform: translateX(-3px) skewX(-14deg); }
  }
  .taskin-listening { animation: taskin-taskin-listening 3.2s ease-in-out infinite; }
  @keyframes taskin-taskin-listening {
    0%, 100% { transform: rotate(6deg) scale(1, 1); }
    50% { transform: rotate(6deg) scale(1.015, 1.015); }
  }
  @media (prefers-reduced-motion: reduce) {
    .taskin-motion { animation-name: none !important; }
    .taskin-motion #right-arm { animation-name: none !important; }
    .taskin-motion #left-arm { animation-name: none !important; }
    .taskin-motion #taskin-tentacles { animation-name: none !important; }
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
  .sapin-point-up { animation: taskin-sapin-point-up 0.9s ease-in-out; animation-iteration-count: 1; }
  .sapin-point-down { animation: taskin-sapin-point-down 0.9s ease-in-out; animation-iteration-count: 1; }
  .sapin-start { animation: taskin-sapin-start 1.1s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-sapin-start {
    0%, 100% { transform: translateY(0) scale(1, 1); }
    30%, 55% { transform: translateY(0) scale(1.05, 0.9); }
    80% { transform: translateY(-8px) scale(0.98, 1.03); }
  }
  .sapin-blocked { animation: taskin-sapin-blocked 1.6s ease-in-out forwards; animation-iteration-count: 1; }
  @keyframes taskin-sapin-blocked {
    0% { transform: translateY(0) scale(1, 1); }
    25%, 100% { transform: translateY(4px) scale(1.04, 0.92); }
  }
  .sapin-effort { animation: taskin-sapin-effort 2s linear; }
  .sapin-effort #body-legs { animation: taskin-sapin-effort-legs 0.14s linear infinite; }
  @keyframes taskin-sapin-effort {
    0% { transform: translate(0, 0); }
    10% { transform: translate(-1.5px, 0.75px); }
    20% { transform: translate(0, 0); }
    30% { transform: translate(1.5px, -0.75px); }
    40% { transform: translate(0, 0); }
    50% { transform: translate(-1.5px, 0.75px); }
    60% { transform: translate(0, 0); }
    70% { transform: translate(1.5px, -0.75px); }
    80% { transform: translate(0, 0); }
    90% { transform: translate(-1.5px, 0.75px); }
    100% { transform: translate(0, 0); }
  }
  @keyframes taskin-sapin-effort-legs {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }
  .sapin-wake { animation: taskin-sapin-wake 2s ease-in-out; animation-iteration-count: 1; transform-origin: 50% 100%; }
  @keyframes taskin-sapin-wake {
    0% { transform: scale(1, 1); }
    35%, 70% { transform: scale(0.97, 1.06); }
    100% { transform: scale(1, 1); }
  }
  .sapin-wave { animation: taskin-sapin-wave 1.4s ease-in-out; animation-iteration-count: 1; }
  .sapin-wave #right-arm {
    transform-box: view-box;
    transform-origin: 230px 113px;
    animation: taskin-sapin-wave-arm 1.4s ease-in-out;
    animation-iteration-count: 1;
  }
  .sapin-travel-left { animation: taskin-sapin-travel-left 0.9s ease-in-out; animation-iteration-count: 1; }
  .sapin-travel-right { animation: taskin-sapin-travel-right 0.9s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-sapin-travel-left {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1, 1); }
    20% { transform: translate(0, 0) rotate(0deg) scale(1.06, 0.9); }
    50% { transform: translate(-6px, -20px) rotate(-8deg) scale(0.97, 1.04); }
    80% { transform: translate(0, 0) rotate(0deg) scale(1.08, 0.88); }
  }
  @keyframes taskin-sapin-travel-right {
    0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1, 1); }
    20% { transform: translate(0, 0) rotate(0deg) scale(1.06, 0.9); }
    50% { transform: translate(6px, -20px) rotate(8deg) scale(0.97, 1.04); }
    80% { transform: translate(0, 0) rotate(0deg) scale(1.08, 0.88); }
  }
  .sapin-catch-fly { animation: taskin-sapin-catch-fly 1.6s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-sapin-catch-fly {
    0%, 55%, 80%, 100% { transform: translateY(0) scale(1, 1); }
    66% { transform: translateY(-3px) scale(1.02, 0.98); }
  }
  #sapin-tongue-reach { transform: scale(0); transform-box: view-box; transform-origin: 160px 124px; }
  .sapin-catch-fly #sapin-tongue-reach { animation: taskin-sapin-tongue 1.6s linear; animation-iteration-count: 1; }
  @keyframes taskin-sapin-tongue {
    0%, 60% { transform: scale(0); }
    66% { transform: scale(1); }
    78%, 100% { transform: scale(0); }
  }
  .sapin-catch-fly #body-throat { animation: taskin-sapin-gulp 1.6s ease-in-out; animation-iteration-count: 1; }
  @keyframes taskin-sapin-gulp {
    0%, 80% { transform: scale(0); }
    88% { transform: scale(1); }
    100% { transform: scale(0); }
  }
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
  @keyframes taskin-sapin-point-up {
    0%, 100% { transform: translateY(0); }
    30%, 70% { transform: translateY(-3px); }
  }
  @keyframes taskin-sapin-point-down {
    0%, 100% { transform: translateY(0); }
    30%, 70% { transform: translateY(3px); }
  }
  @keyframes taskin-sapin-wave {
    0%, 100% { transform: rotate(0deg); }
    25%, 75% { transform: rotate(-1.5deg); }
    50% { transform: rotate(1.5deg); }
  }
  @keyframes taskin-sapin-wave-arm {
    0%, 100% { transform: rotate(0deg); }
    10%, 40%, 70% { transform: rotate(-15deg); }
    25%, 55%, 85% { transform: rotate(15deg); }
  }
  .sapin-speaking #body-throat { animation: taskin-sapin-speaking-throat 0.17s ease-in-out infinite; }
  @keyframes taskin-sapin-speaking-throat {
    0%, 100% { transform: scale(0.35); }
    50% { transform: scale(1); }
  }
  .sapin-listening { animation: taskin-sapin-listening 3.2s ease-in-out infinite; }
  @keyframes taskin-sapin-listening {
    0%, 100% { transform: rotate(6deg) scale(1, 1); }
    50% { transform: rotate(6deg) scale(1.02, 1.02); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sapin-motion { animation-name: none !important; }
    .sapin-motion #right-arm { animation-name: none !important; }
    .sapin-motion #left-arm { animation-name: none !important; }
    .sapin-motion #body-throat { animation-name: none !important; }
    .sapin-motion #sapin-tongue-reach { animation-name: none !important; }
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
  /**
   * A pose que muda no meio da acao: cada passo vale a partir de `atMs`, por cima
   * da `pose` e dos passos anteriores. E como os olhos seguem a mosca.
   */
  steps?: { atMs: number; pose: ActionPose }[];
}

/** Os dois bracos para o alto, sorrindo: a comemoracao. */
const celebratePose = (shoulder: number, forearm: number): ActionPose => ({
  leftArm: armPosition(shoulder, forearm),
  rightArm: armPosition(shoulder, forearm),
  mouthExpression: 'smile',
});

/**
 * O braco direito aponta e os olhos acompanham: os gestos de mover acima e abaixo
 * na priorizacao. O esquerdo fica de fora, na pose de descanso da variante.
 */
const pointPose = (lookDirection: 'up' | 'down', shoulder: number, forearm: number): ActionPose => ({
  rightArm: armPosition(shoulder, forearm),
  lookDirection,
});

/** Para cima, a mao acima do ombro, quase vertical. */
const POINT_UP = pointPose('up', -80, -88);

/** Para baixo, a mao abaixo da barriga, rente ao corpo. */
const POINT_DOWN = pointPose('down', 85, 92);

/**
 * O aceno, na chegada e na despedida: o braco direito erguido, a mao ao lado da
 * cabeca, sorrindo. O balanco e do CSS, girando o `#right-arm` em volta do ombro.
 */
const WAVE: ActionPose = { rightArm: armPosition(-40, -95), mouthExpression: 'smile' };

/**
 * A largada: os dois bracos dobrados, cotovelo para fora e a mao na altura do
 * ombro, de olhos abertos. O puxao e do CSS, girando cada braco em volta do ombro.
 */
const START: ActionPose = {
  leftArm: armPosition(30, -70),
  rightArm: armPosition(30, -70),
  eyeState: 'wide',
};

/**
 * O esforco: os dois bracos para o alto segurando a barra, de olhos apertados.
 * Os bracos a -70/-100 graus levam as maos aos pontos de `WEIGHT_HANDS`.
 */
const EFFORT: ActionPose = {
  leftArm: armPosition(-70, -100),
  rightArm: armPosition(-70, -100),
  eyeState: 'squint',
};

/**
 * O despertar: o bocejo de boca em O, olhos semiabertos e a espreguicada, com os
 * bracos em V para o alto e para fora. Para fora e nao sobre a cabeca: puxados
 * para dentro, os bracos entravam no contorno do corpo e sumiam.
 */
const WAKE: ActionPose = {
  leftArm: armPosition(-55, -70),
  rightArm: armPosition(-55, -70),
  eyeState: 'squint',
  mouthExpression: 'o-shape',
};

/**
 * Maos na cintura, de cara virada e cenho franzido. Os bracos cruzados nao cabiam:
 * o braco do Taskin tem 50 de comprimento e o ombro fica a 65 da linha do meio, e
 * sobre a barriga, na cor do corpo, eles sumiam. De cotovelos para fora, ficam a
 * vista, e as maos voltam ate a cintura sem entrar no corpo.
 */
const BLOCKED_TASKIN: ActionPose = {
  leftArm: armPosition(10, 150),
  rightArm: armPosition(10, 150),
  lookDirection: 'left',
  mouthExpression: 'frown',
};

/** O Sapin senta e desanima: olhos apertados e a boca para baixo. */
const BLOCKED_SAPIN: ActionPose = { eyeState: 'squint', mouthExpression: 'frown' };

/**
 * O bote do Sapin, na `catch-fly`: os olhos seguem a mosca para a direita e, aos
 * 60%, quando ela para na frente da boca, voltam ao centro e a boca abre para a
 * lingua sair. No gole, sorri.
 */
const CATCH_FLY: Pick<ActionConfig, 'pose' | 'steps'> = {
  pose: { lookDirection: 'right' },
  steps: [
    { atMs: 960, pose: { lookDirection: 'center', mouthExpression: 'open' } },
    { atMs: 1280, pose: { mouthExpression: 'smile' } },
  ],
};

/**
 * A lingua do Sapin, no desenho da boca do Taskin (a ancora `mouthTransform` a
 * leva para a boca do sapo): sai do meio da boca aberta e a ponta cai onde a
 * mosca para.
 */
const TONGUE_ROOT = { x: 160, y: 124 };
const TONGUE_TIP = { x: FLY_STOP.x - MOUTH_OFFSET.sapin.x, y: FLY_STOP.y - MOUTH_OFFSET.sapin.y };

/**
 * As acoes de cada variante. A que falta numa variante resolve `false` na hora:
 * e o que deixa uma acao existir so num dos bichos.
 */
export const ACTIONS: Record<TaskinVariant, Partial<Record<TaskinAction, ActionConfig>>> = {
  taskin: {
    nod: { className: 'taskin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'taskin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'taskin-celebrate', durationMs: 1200, pose: celebratePose(-70, -100) },
    'point-up': { className: 'taskin-point-up', durationMs: 900, pose: POINT_UP },
    'point-down': { className: 'taskin-point-down', durationMs: 900, pose: POINT_DOWN },
    wave: { className: 'taskin-wave', durationMs: 1400, pose: WAVE },
    start: { className: 'taskin-start', durationMs: 1100, pose: START },
    blocked: { className: 'taskin-blocked', durationMs: 1600, pose: BLOCKED_TASKIN },
    effort: { className: 'taskin-effort', durationMs: 2000, pose: EFFORT },
    wake: { className: 'taskin-wake', durationMs: 2000, pose: WAKE },
    'travel-left': { className: 'taskin-travel-left', durationMs: 900, pose: { lookDirection: 'left' } },
    'travel-right': { className: 'taskin-travel-right', durationMs: 900, pose: { lookDirection: 'right' } },
  },
  sapin: {
    nod: { className: 'sapin-nod', durationMs: 700, pose: { mouthExpression: 'smile' } },
    shake: { className: 'sapin-shake', durationMs: 700, pose: { mouthExpression: 'frown' } },
    celebrate: { className: 'sapin-celebrate', durationMs: 1200, pose: celebratePose(-60, -100) },
    'point-up': { className: 'sapin-point-up', durationMs: 900, pose: POINT_UP },
    'point-down': { className: 'sapin-point-down', durationMs: 900, pose: POINT_DOWN },
    wave: { className: 'sapin-wave', durationMs: 1400, pose: WAVE },
    start: { className: 'sapin-start', durationMs: 1100, pose: START },
    blocked: { className: 'sapin-blocked', durationMs: 1600, pose: BLOCKED_SAPIN },
    effort: { className: 'sapin-effort', durationMs: 2000, pose: EFFORT },
    wake: { className: 'sapin-wake', durationMs: 2000, pose: WAKE },
    'catch-fly': { className: 'sapin-catch-fly', durationMs: 1600, ...CATCH_FLY },
    'travel-left': { className: 'sapin-travel-left', durationMs: 900, pose: { lookDirection: 'left' } },
    'travel-right': { className: 'sapin-travel-right', durationMs: 900, pose: { lookDirection: 'right' } },
  },
};

/**
 * Quanto uma acao dura, sem toca-la: e o que deixa o mapa de tarefas casar o
 * trajeto com o pulo do Sapin ou o nado do Taskin, que se mexem no lugar. A acao
 * que a variante nao tem dura zero, porque `play` resolve na hora.
 */
export function actionDuration(variant: TaskinVariant, action: TaskinAction): number {
  return ACTIONS[variant][action]?.durationMs ?? 0;
}

/**
 * A escuta, enquanto o microfone esta ligado: nao e acao de uma vez so, e dura o
 * quanto durar a prop `listening`. Perde para a acao que estiver rodando e ganha
 * do humor. O Taskin leva a mao direita para junto da cabeca, como quem apura o
 * ouvido; os dois arregalam os olhos. A inclinacao e a respiracao sao do CSS.
 */
const LISTENING: Record<TaskinVariant, ActionPose> = {
  taskin: { rightArm: armPosition(-50, -140), eyeState: 'wide' },
  sapin: { eyeState: 'wide' },
};

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
    /** O microfone esta ligado: o mascote fica na pose de escuta enquanto for `true`. */
    listening: {
      type: Boolean,
      default: false,
    },
    /** Ha fala tocando: a boca acompanha e, no Sapin, o papo pulsa a cada silaba. */
    speaking: {
      type: Boolean,
      default: false,
    },
    /**
     * Quantas bolinhas o polvo tem no ar: o aviso de tasks demais em andamento.
     * Dura enquanto durar a prop. So o Taskin desenha; o Sapin ignora.
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
      current.stepTimers.forEach(clearTimeout);
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
      const sapin = props.variant === 'sapin';
      const variant = props.variant;
      const pose = running.value
        ? { ...running.value.config.pose, ...running.value.stepPose }
        : props.listening
          ? LISTENING[variant]
          : {};

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
        // O grupo de fora e o que arrasta na viagem: um `transform` de CSS nele
        // apagaria o `translate` do atributo, que por isso fica no de dentro.
        h('g', { id: 'taskin-tentacles' }, [
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
              speed:
                props.mood === 'dancing' ? 1.8 : props.mood === 'tired' ? 0.5 : props.mood === 'sleeping' ? 0 : 1.1,
              fluid: true,
              translateX: -10,
              translateY: 0,
            }),
            h(TaskinTentacleWithItem, {
              tentacleColor: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled,
              speed:
                props.mood === 'dancing' ? 1.6 : props.mood === 'tired' ? 0.7 : props.mood === 'sleeping' ? 0 : 0.9,
              fluid: true,
              translateX: 10,
              translateY: 0,
            }),
            h(TaskinTentacleWithItem, {
              tentacleColor: config.value.tentacleColor,
              animationsEnabled: props.animationsEnabled && wiggleTentacles.value,
              speed:
                props.mood === 'dancing' ? 1.7 : props.mood === 'tired' ? 0.6 : props.mood === 'sleeping' ? 0 : 1.0,
              fluid: true,
              translateX: 30,
              translateY: 0,
            }),
          ]),
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
          speaking: props.speaking,
        }),
        // A lingua do Sapin, so no bote da `catch-fly`: um traco rosa grosso de
        // ponta redonda, preso a boca. Quem a estica e recolhe e o CSS.
        sapin &&
          running.value?.action === 'catch-fly' &&
          h('g', { id: 'sapin-tongue', transform: mouthTransform(variant) }, [
            h('g', { id: 'sapin-tongue-reach' }, [
              h('path', {
                d: `M${TONGUE_ROOT.x} ${TONGUE_ROOT.y} L${TONGUE_TIP.x} ${TONGUE_TIP.y}`,
                stroke: '#FF9EB5',
                'stroke-width': '6',
                'stroke-linecap': 'round',
                fill: 'none',
              }),
              h('circle', { cx: String(TONGUE_TIP.x), cy: String(TONGUE_TIP.y), r: '4.5', fill: '#FF9EB5' }),
            ]),
          ]),
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
        !sapin &&
          props.juggling > 0 &&
          h(TaskinEffectJuggle, {
            balls: props.juggling,
            animationsEnabled: props.animationsEnabled,
          }),
        running.value?.action === 'catch-fly' &&
          h(TaskinEffectFly, {
            animationsEnabled: props.animationsEnabled,
          }),
        running.value?.action === 'effort' &&
          h(TaskinEffectWeight, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
        (config.value.showSweat || running.value?.action === 'effort') &&
          h(TaskinEffectSweat, {
            variant,
            animationsEnabled: props.animationsEnabled,
          }),
      ].filter(Boolean);

      const { byMood, css } = MOTIONS[variant];
      // A acao, enquanto roda, toma o lugar da escuta, e a escuta o do humor.
      const idle = props.listening ? `${variant}-listening` : byMood[props.mood];
      const motion = props.animationsEnabled ? (running.value?.config.className ?? idle) : undefined;
      const components = [
        shadow,
        h(
          'g',
          {
            id: `${variant}-motion`,
            class: [
              `${variant}-motion`,
              motion,
              variant === 'sapin' && props.animationsEnabled && props.speaking && 'sapin-speaking',
              // Os bracos sobem e descem alternados, no ritmo das bolinhas. As
              // acoes que mexem num braco vem depois no CSS e ganham dele.
              !sapin && props.animationsEnabled && props.juggling > 0 && 'taskin-juggling',
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
          },
          components,
        ),
      );
    };
  },
});
