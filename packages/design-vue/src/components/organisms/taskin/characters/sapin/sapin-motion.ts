import type { TaskinMood } from '../../Taskin.types';

/**
 * Como o Sapin se mexe em cada humor. O sapo mexe o corpo inteiro — olhos, boca
 * e efeitos juntos, porque os olhos moram nos calombos da cabeca: pula dancando,
 * flutua apaixonado, balanca cansado, treme com frio e arfa com calor. Dormindo
 * fica parado, como o Taskin.
 */
export const SAPIN_MOTION_BY_MOOD: Partial<Record<TaskinMood, string>> = {
  dancing: 'sapin-hop',
  'in-love': 'sapin-float',
  tired: 'sapin-sway',
  cold: 'sapin-shiver',
  hot: 'sapin-pant',
};

// Nomes com prefixo: o `<style>` dentro do SVG vale para o documento inteiro.
export const SAPIN_MOTION_CSS = `
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
