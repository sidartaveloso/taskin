<template>
  <div class="taskin-says" :class="attrsClass" :style="[attrsStyle, rootStyle]">
    <Taskin
      ref="taskinRef"
      v-bind="taskinAttrs"
      :size="size"
      :variant="variant"
      :animations-enabled="animationsEnabled"
      :show-thought-bubble="text ? false : undefined"
    />
    <div
      v-if="text"
      class="taskin-says__bubble"
      :class="{ 'taskin-says__bubble--animated': animationsEnabled }"
      role="status"
      data-testid="taskin-says-bubble"
    >
      <svg class="taskin-says__tail" viewBox="0 0 30 30" aria-hidden="true">
        <rect class="taskin-says__tail-gap" x="21" y="4" width="5" height="12" />
        <path class="taskin-says__tail-fill" d="M23 3 C 14 5, 8 10, 2 21 C 9 16, 15 14, 23 15 Z" />
        <path class="taskin-says__tail-line" d="M23 3 C 14 5, 8 10, 2 21 C 9 16, 15 14, 23 15" />
      </svg>
      <p class="taskin-says__text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * O balao de fala em HTML, fora do SVG do mascote.
 *
 * O balao em SVG (`speechText`, task-166) vive dentro do quadro de 320x260 e
 * escala junto com o desenho: a 180px, o tamanho do chat, o texto sai com uns
 * 6px e nao se le. Aqui o balao e HTML ancorado ao desenho, com texto em
 * pixels de verdade, quebra de linha natural e cores que o tema pode trocar
 * pelas variaveis `--taskin-says-*`. O SVG continua para renders isolados.
 */
import { computed, ref, type StyleValue, useAttrs } from 'vue';
import { MOUTH_INK } from '../../atoms/taskin-mouth/TaskinMouth.types';
import Taskin from './Taskin';
import type { TaskinAction } from './Taskin.actions';
import type { TaskinVariant } from './Taskin.variants';
import type { TaskinSaysProps } from './TaskinSays.types';

defineOptions({ name: 'TaskinSays', inheritAttrs: false });

const props = withDefaults(defineProps<TaskinSaysProps>(), {
  text: '',
  size: 340,
  variant: 'taskin',
  animationsEnabled: true,
  maxWidth: 260,
});

const attrs = useAttrs();
// `class` e `style` ficam na raiz; o resto atravessa para o `Taskin`.
const attrsClass = computed(() => attrs.class as string | undefined);
const attrsStyle = computed(() => attrs.style as StyleValue);
const taskinAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});

/**
 * Onde a ponta do rabicho encosta, no quadro de 320 do mascote: um pouco a
 * direita da beira da cabeca, na altura da ponta (y ~107). O quadro tem uma
 * margem vazia a direita do bicho, entao o balao entra nela em vez de nascer
 * depois dela; sem isso ficava longe demais de quem fala.
 */
const HEAD_RIGHT: Record<TaskinVariant, number> = { taskin: 229, sapin: 233 };
/** A altura, no quadro de 260, em que a ponta encosta: o meio da cabeca, abaixo dos olhos. */
const HEAD_LEVEL = 100;
/** Quanto o rabicho avanca para a esquerda da borda do balao, e quanto a ponta desce do topo dele (ver o CSS do `__tail`). */
const TAIL_REACH = 22;
const TAIL_DROP = 35;

const rootStyle = computed(() => ({
  '--taskin-says-max-width': `${props.maxWidth}px`,
  // O balao desce ate a ponta do rabicho ficar na altura da cabeca; num mascote
  // muito pequeno (abaixo de ~110px) ele para no topo e a ponta fica um pouco abaixo.
  '--taskin-says-bubble-top': `${Math.max(0, Math.round((props.size * HEAD_LEVEL) / 320 - TAIL_DROP))}px`,
  '--taskin-says-bubble-offset': `${Math.round(TAIL_REACH - (props.size * (320 - HEAD_RIGHT[props.variant])) / 320)}px`,
  '--taskin-says-variant-ink': MOUTH_INK[props.variant],
}));

const taskinRef = ref<{ play: (action: TaskinAction) => Promise<boolean> } | null>(null);

defineExpose({
  /** O `play` do `Taskin` de dentro, para o `useTaskinScript` e afins. */
  play: (action: TaskinAction): Promise<boolean> => taskinRef.value?.play(action) ?? Promise.resolve(false),
});
</script>

<style scoped>
.taskin-says {
  display: inline-flex;
  align-items: flex-start;
  --taskin-says-bg: #ffffff;
  --taskin-says-ink: var(--taskin-says-variant-ink, #2c3e50);
  --taskin-says-text: #2c3e50;
  --taskin-says-font-size: 15px;
  --taskin-says-border: 2px;
}

.taskin-says__bubble {
  position: relative;
  flex: 0 0 auto;
  margin-top: var(--taskin-says-bubble-top, 48px);
  /* Negativo: entra na margem vazia do quadro ate a ponta do rabicho encostar na cabeca. */
  margin-left: var(--taskin-says-bubble-offset, 0px);
  max-width: var(--taskin-says-max-width, 260px);
  padding: 10px 14px;
  background: var(--taskin-says-bg);
  border: var(--taskin-says-border) solid var(--taskin-says-ink);
  border-radius: 14px;
  color: var(--taskin-says-text);
  font-size: var(--taskin-says-font-size);
  line-height: 1.4;
  transform-origin: left top;
}

.taskin-says__bubble--animated {
  animation: taskin-says-pop 0.25s ease-out;
}

/* `break-word`, e nao `anywhere`: `anywhere` encolhe a largura minima ate um caractere, e "Oi" virava duas linhas. */
.taskin-says__text {
  margin: 0;
  overflow-wrap: break-word;
}

/*
 * O rabicho: base larga colada na borda esquerda do balao, ponta curva para
 * baixo e para a esquerda, em direcao a cabeca. O absoluto parte da borda de
 * dentro, entao com `left: -24px` a borda de 2px do balao fica em x 22–24 do
 * SVG: a base das curvas esta em x 23, no meio dela, e o `__tail-gap` cobre o
 * trecho da borda onde o rabicho encosta, para o contorno seguir continuo. O
 * traco e so das duas curvas de fora; a base nao tem linha. `top: 14px` tira
 * a base do canto arredondado (raio 14).
 */
.taskin-says__tail {
  position: absolute;
  left: -24px;
  top: 14px;
  width: 30px;
  height: 30px;
  overflow: visible;
}

.taskin-says__tail-gap,
.taskin-says__tail-fill {
  fill: var(--taskin-says-bg);
}

.taskin-says__tail-line {
  fill: none;
  stroke: var(--taskin-says-ink);
  stroke-width: var(--taskin-says-border);
  stroke-linecap: butt;
  stroke-linejoin: round;
}

@keyframes taskin-says-pop {
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .taskin-says__bubble--animated { animation: none; }
}
</style>
