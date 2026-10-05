<template>
  <div
    ref="root"
    class="speech-bubble"
    :class="[
      `speech-bubble--${kind}`,
      {
        'speech-bubble--animated': animated,
        'speech-bubble--drawn': drawn,
        'speech-bubble--tail-right': actualTail === 'right',
        'speech-bubble--with-tail': actualTail !== 'none',
      },
    ]"
    :style="vars"
  >
    <svg
      v-if="drawn && box"
      class="speech-bubble__outline"
      :width="box.width"
      :height="box.height"
      aria-hidden="true"
    >
      <path v-if="kind === 'shout'" class="speech-bubble__shape" :d="shout" />
      <template v-else-if="cloud">
        <path class="speech-bubble__shape" :d="cloud.d" />
        <circle
          v-for="(puff, i) in cloud.puffs"
          :key="i"
          class="speech-bubble__shape speech-bubble__puff"
          :cx="puff.x"
          :cy="puff.y"
          :r="puff.r"
        />
      </template>
    </svg>
    <svg
      v-else-if="!drawn && actualTail !== 'none'"
      class="speech-bubble__tail"
      :viewBox="`0 0 ${T.size} ${T.size}`"
      aria-hidden="true"
    >
      <path class="speech-bubble__tail-fill" :d="tailPaths.fill" />
      <path class="speech-bubble__tail-line" :d="tailPaths.line" />
    </svg>
    <p class="speech-bubble__text">
      <slot>{{ text }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Um balao de fala: caixa de cantos arredondados com rabicho curvo, em HTML.
 *
 * Nasceu dentro do `TaskinSays` (task-168) e virou atomo (task-170) para
 * qualquer um usar e para as cores deixarem de ser segredo de variavel CSS.
 * Cada aparencia tem duas portas: a prop (vista nos Controls do Storybook) e a
 * variavel `--speech-bubble-*` (para tema). A prop, quando vem, ganha; sem
 * ela, vale a variavel herdada; sem as duas, o padrao.
 *
 * O rabicho e um SVG de 30x30 (que cresce com a borda) posicionado para a
 * borda do balao cair no meio da base dele (x 23), qualquer que seja a
 * espessura. O fundo dele apaga o trecho da borda onde ele encosta, e o traco
 * e so das duas curvas de fora: o contorno segue continuo.
 *
 * A forma diz como se fala, como nos quadrinhos (`kind`, task-171). Fala,
 * sussurro e narracao sao esta caixa de CSS, com borda solida, tracejada ou
 * reta. O grito e o pensamento nao cabem numa borda: a caixa fica
 * transparente e um SVG, no tamanho medido dela, desenha a estrela ou a
 * nuvem (`speech-bubble-shapes.ts`), com a ponta no mesmo lugar do rabicho.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  SPEECH_BUBBLE_DEFAULTS,
  SPEECH_BUBBLE_TAIL,
  type SpeechBubbleProps,
  speechBubbleTailScale,
} from './SpeechBubble.types';
import { type BubbleBox, shoutOutline, thoughtCloud } from './speech-bubble-shapes';

defineOptions({ name: 'SpeechBubble' });

const props = withDefaults(defineProps<SpeechBubbleProps>(), {
  text: '',
  kind: 'speech',
  tail: 'left',
  tailTop: SPEECH_BUBBLE_DEFAULTS.tailTop,
  background: undefined,
  borderColor: undefined,
  textColor: undefined,
  borderWidth: undefined,
  fontSize: undefined,
  radius: undefined,
  maxWidth: undefined,
  animated: true,
});

const T = SPEECH_BUBBLE_TAIL;
const r = (n: number) => Math.round(n * 100) / 100;

/*
 * As duas curvas comecam e terminam na base (x 23, o meio da borda), e cada
 * uma ganha um trecho reto, na direcao em que chega, ate a borda de dentro
 * (x 23 + b/2): o traco termina rente a ela e a junta nao faz degrau. O fundo
 * vai das curvas ate x 30, por dentro do balao, e apaga o trecho da borda que
 * fica entre elas. Medidas no SVG de 30x30, que escala com a borda; a borda
 * de 2px e o padrao quando so o tema (e nao a prop) a define.
 */
const tailPaths = computed(() => {
  const b = props.borderWidth ?? SPEECH_BUBBLE_DEFAULTS.borderWidth;
  const e = b / 2 / speechBubbleTailScale(b);
  const topo = { x: r(T.baseX + e), y: r(T.baseTop - (e * 2) / 9) };
  const base = { x: r(T.baseX + e), y: r(T.baseBottom + e / 8) };
  const curvas = `L${T.baseX} ${T.baseTop} C 14 5, 8 10, ${T.tip.x} ${T.tip.y} C 9 16, 15 14, ${T.baseX} ${T.baseBottom} L${base.x} ${base.y}`;
  return {
    line: `M${topo.x} ${topo.y} ${curvas}`,
    fill: `M${T.size} ${T.baseTop} L${topo.x} ${topo.y} ${curvas} L${T.size} ${T.baseBottom} Z`,
  };
});

/** A narracao e a caixa do narrador: nao sai da boca de ninguem. */
const actualTail = computed(() => (props.kind === 'narration' ? 'none' : props.tail));
/** As formas que nao cabem numa borda de CSS. */
const drawn = computed(() => props.kind === 'shout' || props.kind === 'thought');

/*
 * O tamanho da caixa por fora, medido: a estrela e a nuvem sao desenhadas em
 * volta dele. `offsetWidth` ignora o `transform` do pop de entrada.
 */
const root = ref<HTMLElement | null>(null);
const size = ref<{ width: number; height: number } | null>(null);
const medir = () => {
  const el = root.value;
  if (el) size.value = { width: el.offsetWidth, height: el.offsetHeight };
};
let observer: ResizeObserver | undefined;
onMounted(() => {
  medir();
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    observer = new ResizeObserver(medir);
    observer.observe(root.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

const box = computed<BubbleBox | null>(() =>
  size.value
    ? {
        ...size.value,
        borderWidth: props.borderWidth ?? SPEECH_BUBBLE_DEFAULTS.borderWidth,
        tail: actualTail.value,
        tailTop: props.tailTop,
      }
    : null,
);
const shout = computed(() => (box.value && props.kind === 'shout' ? shoutOutline(box.value) : ''));
const cloud = computed(() => (box.value && props.kind === 'thought' ? thoughtCloud(box.value) : null));

const px = (n: number | undefined) => (n === undefined ? undefined : `${n}px`);

/** So as props que vieram viram variavel: as outras deixam passar o tema herdado. */
const vars = computed(() => {
  const entries: [string, string | undefined][] = [
    ['--speech-bubble-bg', props.background],
    ['--speech-bubble-border-color', props.borderColor],
    ['--speech-bubble-text-color', props.textColor],
    ['--speech-bubble-border-width', px(props.borderWidth)],
    ['--speech-bubble-font-size', px(props.fontSize)],
    ['--speech-bubble-radius', px(props.radius)],
    ['--speech-bubble-max-width', px(props.maxWidth)],
    ['--speech-bubble-tail-top', px(props.tailTop)],
    [
      '--speech-bubble-tail-scale',
      props.borderWidth === undefined ? undefined : String(speechBubbleTailScale(props.borderWidth)),
    ],
  ];
  return Object.fromEntries(entries.filter((e): e is [string, string] => e[1] !== undefined));
});
</script>

<style scoped>
.speech-bubble {
  --_bg: var(--speech-bubble-bg, #ffffff);
  --_border-color: var(--speech-bubble-border-color, #2c3e50);
  --_border-width: var(--speech-bubble-border-width, 2px);
  --_tail-scale: var(--speech-bubble-tail-scale, 1);
  position: relative;
  /* Abraca o texto em qualquer contexto: solto num bloco, ocupava a largura maxima ate para "Oi". */
  width: fit-content;
  /* `maxWidth` e a largura do texto, como no `TaskinSays` de antes; explicito para um reset global nao mudar isso. */
  box-sizing: content-box;
  max-width: var(--speech-bubble-max-width, 260px);
  padding: 10px 14px;
  background: var(--_bg);
  border: var(--_border-width) solid var(--_border-color);
  border-radius: var(--speech-bubble-radius, 14px);
  color: var(--speech-bubble-text-color, #2c3e50);
  font-size: var(--speech-bubble-font-size, 15px);
  line-height: 1.4;
  transform-origin: left top;
}

/*
 * A base do rabicho tem de caber na parte reta da lateral: com borda grossa o
 * rabicho cresce, e num balao de uma linha so a base passava da borda de baixo.
 * Por fora, o balao precisa do topo da base, mais a base (15 unidades na
 * escala), mais as duas bordas e uma folga; a altura minima e isso menos o
 * padding (10px em cima e embaixo) e as bordas, porque conta so o conteudo.
 */
.speech-bubble--with-tail {
  min-height: calc(var(--speech-bubble-tail-top, 14px) + 16px * var(--_tail-scale) - 16px);
}

.speech-bubble--tail-right {
  transform-origin: right top;
}

/*
 * Grito e pensamento: a caixa guarda o tamanho (a borda continua la, so que
 * transparente) e o SVG por tras do texto desenha a forma. `isolation` cria o
 * contexto para o `z-index: -1` ficar atras do texto e nao atras da pagina.
 */
.speech-bubble--drawn {
  isolation: isolate;
  background: transparent;
  border-color: transparent;
}

.speech-bubble__outline {
  position: absolute;
  left: calc(-1 * var(--_border-width));
  top: calc(-1 * var(--_border-width));
  z-index: -1;
  overflow: visible;
  pointer-events: none;
}

.speech-bubble__shape {
  fill: var(--_bg);
  stroke: var(--_border-color);
  stroke-width: var(--_border-width);
  stroke-linejoin: miter;
  stroke-miterlimit: 12;
}

.speech-bubble__puff {
  stroke-linejoin: round;
}

/* O grito, em negrito. */
.speech-bubble--shout .speech-bubble__text {
  font-weight: 700;
}

/* O sussurro: borda e rabicho tracejados, e o texto em italico. */
.speech-bubble--whisper {
  border-style: dashed;
}

.speech-bubble--whisper .speech-bubble__tail-line {
  stroke-dasharray: 4 3;
}

.speech-bubble--whisper .speech-bubble__text {
  font-style: italic;
}

/* A narracao: a caixa do narrador, de canto reto e amarelada, sem rabicho. */
.speech-bubble--narration {
  --_bg: var(--speech-bubble-bg, #fdf3c7);
  border-radius: var(--speech-bubble-radius, 2px);
}

.speech-bubble--animated {
  animation: speech-bubble-pop 0.25s ease-out;
}

/* `break-word`, e nao `anywhere`: `anywhere` encolhe a largura minima ate um caractere, e "Oi" virava duas linhas. */
.speech-bubble__text {
  margin: 0;
  overflow-wrap: break-word;
}

/*
 * O absoluto parte da borda de dentro. Com `left: -(23*k + b/2)`, a borda de
 * espessura b fica centrada na base do rabicho (x 23 do SVG, na escala k).
 */
.speech-bubble__tail {
  position: absolute;
  left: calc(-23px * var(--_tail-scale) - var(--_border-width) / 2);
  top: var(--speech-bubble-tail-top, 14px);
  width: calc(30px * var(--_tail-scale));
  height: calc(30px * var(--_tail-scale));
  overflow: visible;
}

.speech-bubble--tail-right .speech-bubble__tail {
  left: auto;
  right: calc(-23px * var(--_tail-scale) - var(--_border-width) / 2);
  transform: scaleX(-1);
}

.speech-bubble__tail-fill {
  fill: var(--_bg);
}

/* O SVG escala com k: o traco, em unidades dele, divide por k para sair com b px na tela. */
.speech-bubble__tail-line {
  fill: none;
  stroke: var(--_border-color);
  stroke-width: calc(var(--_border-width) / var(--_tail-scale));
  stroke-linecap: butt;
  stroke-linejoin: round;
}

@keyframes speech-bubble-pop {
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .speech-bubble--animated { animation: none; }
}
</style>
