import type { TaskinMood } from '../../Taskin.types';

/**
 * Como o Taskin se mexe em cada humor: o polvo inteiro, e nao so o corpo —
 * tentaculos, bracos, olhos, boca e efeitos juntos, porque o rosto mora no
 * corpo e os tentaculos saem de baixo dele. Danca de um lado para o outro,
 * flutua apaixonado, balanca cansado, treme com frio e arfa com calor. Dormindo
 * fica parado. Os tentaculos seguem com o ritmo proprio de cada humor por cima.
 */
export const TASKIN_MOTION_BY_MOOD: Partial<Record<TaskinMood, string>> = {
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
export const TASKIN_MOTION_CSS = `
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
  .taskin-ink { animation: taskin-taskin-ink 1.6s ease-out; animation-iteration-count: 1; }
  @keyframes taskin-taskin-ink {
    0%, 100% { transform: translateY(0); }
    10%, 25% { transform: translateY(-8px); }
    55% { transform: translateY(0); }
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
